import { GoogleGenAI, LiveServerMessage, Modality } from "@google/genai";
import { floatTo16BitPCM, base64ToUint8Array } from "../utils/audioUtils";

export type TranscriptionCallback = (text: string, isUser: boolean) => void;

export class GeminiLiveService {
  private ai: GoogleGenAI;
  private model = "gemini-2.5-flash-native-audio-preview-09-2025";
  private sessionPromise: Promise<any> | null = null;
  private inputAudioContext: AudioContext | null = null;
  private outputAudioContext: AudioContext | null = null;
  private processor: ScriptProcessorNode | null = null;
  private source: MediaStreamAudioSourceNode | null = null;
  private nextStartTime = 0;
  private onTranscription: TranscriptionCallback;
  private isConnected = false;

  constructor(apiKey: string, onTranscription: TranscriptionCallback) {
    this.ai = new GoogleGenAI({ apiKey });
    this.onTranscription = onTranscription;
  }

  async connect() {
    if (this.isConnected) return;

    this.inputAudioContext = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 16000 });
    this.outputAudioContext = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });

    this.sessionPromise = this.ai.live.connect({
      model: this.model,
      callbacks: {
        onopen: () => {
          console.log("Gemini Live Connected");
          this.isConnected = true;
        },
        onmessage: async (message: LiveServerMessage) => {
            // Handle Transcriptions
            if (message.serverContent?.outputTranscription) {
                this.onTranscription(message.serverContent.outputTranscription.text, false);
            }
            if (message.serverContent?.inputTranscription) {
                this.onTranscription(message.serverContent.inputTranscription.text, true);
            }

            // Handle Audio Output
            const base64Audio = message.serverContent?.modelTurn?.parts?.[0]?.inlineData?.data;
            if (base64Audio && this.outputAudioContext) {
                const audioData = base64ToUint8Array(base64Audio);
                
                // Decode raw PCM
                const dataInt16 = new Int16Array(audioData.buffer);
                const buffer = this.outputAudioContext.createBuffer(1, dataInt16.length, 24000);
                const channelData = buffer.getChannelData(0);
                for (let i = 0; i < dataInt16.length; i++) {
                    channelData[i] = dataInt16[i] / 32768.0;
                }

                // Schedule playback
                this.nextStartTime = Math.max(this.nextStartTime, this.outputAudioContext.currentTime);
                const source = this.outputAudioContext.createBufferSource();
                source.buffer = buffer;
                source.connect(this.outputAudioContext.destination);
                source.start(this.nextStartTime);
                this.nextStartTime += buffer.duration;
            }
        },
        onclose: () => {
          console.log("Gemini Live Closed");
          this.isConnected = false;
        },
        onerror: (err) => {
          console.error("Gemini Live Error", err);
          this.isConnected = false;
        }
      },
      config: {
        responseModalities: [Modality.AUDIO],
        speechConfig: {
          voiceConfig: { prebuiltVoiceConfig: { voiceName: 'Kore' } }
        },
        inputAudioTranscription: {},
        outputAudioTranscription: {},
        systemInstruction: "You are 'Dispatcher', a helpful tactical operations assistant. Use short, clear, and concise sentences. Mimic military or police radio protocol slightly. Over.",
      }
    });

    await this.sessionPromise;
  }

  async startRecording() {
    if (!this.inputAudioContext) return;
    
    // Resume context if suspended (browser policy)
    if (this.inputAudioContext.state === 'suspended') {
        await this.inputAudioContext.resume();
    }

    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    this.source = this.inputAudioContext.createMediaStreamSource(stream);
    
    // Use deprecated ScriptProcessor for simplicity in this demo (AudioWorklet is better for prod)
    this.processor = this.inputAudioContext.createScriptProcessor(4096, 1, 1);
    
    this.processor.onaudioprocess = (e) => {
        const inputData = e.inputBuffer.getChannelData(0);
        // Downsample or process if needed, here we assume 16k context
        const pcm16 = floatTo16BitPCM(inputData);
        const base64 = btoa(String.fromCharCode(...new Uint8Array(pcm16)));

        if (this.sessionPromise) {
            this.sessionPromise.then(session => {
                session.sendRealtimeInput({
                    media: {
                        mimeType: 'audio/pcm;rate=16000',
                        data: base64
                    }
                });
            });
        }
    };

    this.source.connect(this.processor);
    this.processor.connect(this.inputAudioContext.destination);
  }

  stopRecording() {
    if (this.source) {
        this.source.disconnect();
        this.source.mediaStream.getTracks().forEach(track => track.stop());
        this.source = null;
    }
    if (this.processor) {
        this.processor.disconnect();
        this.processor = null;
    }
  }

  async disconnect() {
    if (this.sessionPromise) {
        // Unfortunately no direct close method on the session object easily accessible 
        // without keeping reference to WebSocket, but the library manages cleanup usually.
        // We will just close contexts.
        this.isConnected = false;
    }
    if (this.inputAudioContext) await this.inputAudioContext.close();
    if (this.outputAudioContext) await this.outputAudioContext.close();
  }
}