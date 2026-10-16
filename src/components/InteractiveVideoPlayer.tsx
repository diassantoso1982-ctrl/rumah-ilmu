import React, { useState, useEffect, useRef } from 'react';
import {
  Play,
  Pause,
  RotateCcw,
  Volume2,
  VolumeX,
  Sparkles,
  CheckCircle2,
  X,
  Star,
  Film,
  Tv,
  ArrowRight
} from 'lucide-react';
import { voiceGuideService } from '../services/voiceGuideService';
import { soundManager } from '../services/soundEffects';

interface InteractiveVideoPlayerProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  duration: string;
  topicId?: string;
  subjectId?: string;
  grade?: number;
  reflectionPrompt: string;
  youtubeId?: string;
  onAddStar?: () => void;
}

export const InteractiveVideoPlayer: React.FC<InteractiveVideoPlayerProps> = ({
  isOpen,
  onClose,
  title,
  duration,
  topicId = 'mat-5-pecahan',
  subjectId = 'matematika',
  grade = 5,
  reflectionPrompt,
  youtubeId = 'p8kZ2T1M6vM',
  onAddStar,
}) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [progress, setProgress] = useState(0); // 0 to 100
  const [mode, setMode] = useState<'animasi' | 'youtube'>('animasi');
  const [isMuted, setIsMuted] = useState(false);
  const [currentCaption, setCurrentCaption] = useState('');
  const [hasCompleted, setHasCompleted] = useState(false);
  const [studentReflectionText, setStudentReflectionText] = useState('');
  const [reflectionSubmitted, setReflectionSubmitted] = useState(false);

  // Scripted video story narration for the animated player
  const videoNarrations: Record<string, { time: number; text: string; visualPhase: string }[]> = {
    'mat-5-pecahan': [
      { time: 0, text: 'Halo Sahabat Pintar! Hari ini kita berpetualang ke dunia pecahan senilai!', visualPhase: 'intro' },
      { time: 20, text: 'Bayangkan ada satu loyang pizza lezat. Kita potong menjadi dua bagian sama besar. Satu potong ini adalah satu per dua (1/2).', visualPhase: 'half' },
      { time: 50, text: 'Sekarang, bagaimana jika pizza yang sama kita potong menjadi empat bagian? Dua potong dari empat (2/4) ukurannya persis sama dengan satu per dua!', visualPhase: 'quarter' },
      { time: 80, text: 'Itulah pecahan senilai! Nilainya sama besar meskipun angka pembilang dan penyebutnya berbeda. Hebat sekali bukan?', visualPhase: 'conclusion' },
    ],
    'ipas-4-fotosintesis': [
      { time: 0, text: 'Pernahkah kamu berpikir bagaimana pohon hijau di pekarangan rumah memasak makanannya?', visualPhase: 'intro' },
      { time: 20, text: 'Akar pohon menyerap air dari dalam tanah, dan daun menyerap gas karbon dioksida dari udara.', visualPhase: 'absorb' },
      { time: 50, text: 'Zat hijau klorofil menangkap sinar matahari yang hangat. Di daun inilah dapur ajaib fotosintesis bekerja!', visualPhase: 'cook' },
      { time: 80, text: 'Hasilnya adalah makanan glukosa untuk tumbuhan dan gas oksigen segar untuk kita bernapas setiap hari!', visualPhase: 'oxygen' },
    ],
    'bind-1-huruf-vokal': [
      { time: 0, text: 'Ayo bernyanyi dan bersuara riang bersama lima sahabat huruf vokal: A, I, U, E, dan O!', visualPhase: 'vokal-all' },
      { time: 25, text: 'A untuk Ayam dan Apel! Buka mulutmu lebar-lebar: AAAA!', visualPhase: 'vokal-a' },
      { time: 50, text: 'I untuk Ikan dan Itik! Tersenyumlah lebar-lebar: IIII!', visualPhase: 'vokal-i' },
      { time: 75, text: 'U, E, dan O membuat kata-kata menjadi bersuara indah!', visualPhase: 'vokal-ueo' },
    ],
    'pancasila-3-gotong-royong': [
      { time: 0, text: 'Pernahkah kamu melihat kawanan semut kecil membawa remah kue yang besar?', visualPhase: 'gotong-intro' },
      { time: 25, text: 'Satu semut tidak sanggup mengangkatnya. Tapi saat bergotong royong bersama-sama, beban berat terasa sangat ringan!', visualPhase: 'gotong-semut' },
      { time: 55, text: 'Di rumah dan sekolah, berat sama dipikul, ringan sama dijinjing! Kita piket kelas dan membantu orang tua dengan riang.', visualPhase: 'gotong-rumah' },
      { time: 80, text: 'Gotong royong adalah warisan luhur bangsa Indonesia yang membuat hidup rukun dan damai!', visualPhase: 'gotong-conclusion' },
    ],
    'mat-6-lingkaran': [
      { time: 0, text: 'Selamat datang di penjelajahan lingkaran dan roda ajaib!', visualPhase: 'circle-intro' },
      { time: 30, text: 'Dari titik pusat ke tepi lingkaran disebut jari-jari. Garis lurus yang membelah lingkaran disebut diameter.', visualPhase: 'diameter' },
      { time: 60, text: 'Ketika roda berputar satu putaran penuh, panjang lintasannya adalah keliling lingkaran yang dikalikan angka pi, yaitu 3 koma 14.', visualPhase: 'pi' },
      { time: 85, text: 'Sekarang kamu bisa mengukur keliling benda bundar apa saja di sekitarmu!', visualPhase: 'measure' },
    ]
  };

  // Fallback dynamic story generator for custom/AI topics
  const defaultStory = [
    { time: 0, text: `Selamat datang di video pembelajaran: ${title}. Mari kita amati konsepnya bersama!`, visualPhase: 'intro' },
    { time: 25, text: `Perhatikan baik-baik prinsip dasar topik ini dalam kehidupan sehari-hari kita.`, visualPhase: 'concept' },
    { time: 55, text: `Kita bisa mempraktikkannya dengan mudah di sekolah maupun di rumah bersama orang tua.`, visualPhase: 'practice' },
    { time: 80, text: `Luar biasa! Kamu telah mempelajari konsep ${title} dengan sangat baik hari ini!`, visualPhase: 'conclusion' },
  ];

  const currentStory = videoNarrations[topicId] || defaultStory;

  // Update animated video playback
  useEffect(() => {
    let interval: any;
    if (isPlaying && mode === 'animasi') {
      interval = setInterval(() => {
        setProgress(prev => {
          const next = prev + 1;
          if (next >= 100) {
            setIsPlaying(false);
            setHasCompleted(true);
            soundManager.playFanfare();
            if (onAddStar) onAddStar();
            voiceGuideService.stop();
            return 100;
          }

          // Match narration caption
          const activeSegment = [...currentStory].reverse().find(s => next >= s.time);
          if (activeSegment && activeSegment.text !== currentCaption) {
            setCurrentCaption(activeSegment.text);
            if (!isMuted) {
              voiceGuideService.speak(activeSegment.text);
            }
          }

          return next;
        });
      }, 350); // ~35 seconds simulated rich educational video clip
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isPlaying, mode, isMuted, currentCaption, currentStory, onAddStar]);

  if (!isOpen) return null;

  const handleTogglePlay = () => {
    if (isPlaying) {
      setIsPlaying(false);
      voiceGuideService.stop();
    } else {
      setIsPlaying(true);
      soundManager.playChime();
      if (progress >= 100) setProgress(0);
      const activeSegment = currentStory.find(s => progress >= s.time) || currentStory[0];
      if (activeSegment && !isMuted) {
        voiceGuideService.speak(activeSegment.text);
      }
    }
  };

  const handleRestart = () => {
    setProgress(0);
    setIsPlaying(true);
    setHasCompleted(false);
    voiceGuideService.stop();
    const firstSegment = currentStory[0];
    setCurrentCaption(firstSegment.text);
    if (!isMuted) {
      voiceGuideService.speak(firstSegment.text);
    }
  };

  const handleClose = () => {
    setIsPlaying(false);
    voiceGuideService.stop();
    onClose();
  };

  const handleSpeakReflectionPrompt = () => {
    voiceGuideService.speak(`Refleksi setelah menonton: ${reflectionPrompt}. Coba ceritakan dengan bahasamu sendiri!`);
  };

  const handleSubmitReflection = (e: React.FormEvent) => {
    e.preventDefault();
    if (!studentReflectionText.trim()) return;
    setReflectionSubmitted(true);
    soundManager.playStarSuccess();
    voiceGuideService.speak('Hebat sekali! Jawaban refleksimu luar biasa dan kamu mendapatkan sepuluh bintang belajar!');
    if (onAddStar) onAddStar();
  };

  // Determine visual phase
  const activePhase = [...currentStory].reverse().find(s => progress >= s.time)?.visualPhase || 'intro';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-slate-950/75 backdrop-blur-sm overflow-y-auto">
      <div className="bg-slate-900 text-white rounded-3xl max-w-3xl w-full my-auto overflow-hidden shadow-2xl border-4 border-amber-400 animate-in fade-in zoom-in-95 duration-200">
        {/* Top Header */}
        <div className="p-4 px-6 bg-slate-800/90 border-b border-slate-700 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-red-600 text-white flex items-center justify-center text-xl shadow-md">
              🎬
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-2xs font-extrabold uppercase bg-red-500/20 text-red-400 border border-red-500/30 px-2.5 py-0.5 rounded-full">
                  Kelas {grade} SD • Video Interaktif
                </span>
                <span className="text-2xs text-slate-400 font-mono">⏱️ {duration}</span>
              </div>
              <h3 className="text-base sm:text-lg font-black font-display text-white mt-0.5 truncate max-w-md">
                {title}
              </h3>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Mode switch: Animasi Interaktif vs YouTube */}
            <div className="hidden sm:flex bg-slate-950 p-1 rounded-xl border border-slate-700 text-2xs font-bold">
              <button
                onClick={() => {
                  setMode('animasi');
                  voiceGuideService.stop();
                }}
                className={`px-2.5 py-1 rounded-lg transition ${
                  mode === 'animasi' ? 'bg-amber-500 text-slate-900 font-black' : 'text-slate-400 hover:text-white'
                }`}
              >
                Animasi Edukasi
              </button>
              <button
                onClick={() => {
                  setMode('youtube');
                  setIsPlaying(false);
                  voiceGuideService.stop();
                }}
                className={`px-2.5 py-1 rounded-lg transition ${
                  mode === 'youtube' ? 'bg-red-600 text-white font-black' : 'text-slate-400 hover:text-white'
                }`}
              >
                Video YouTube
              </button>
            </div>

            <button
              onClick={handleClose}
              className="p-2 rounded-full hover:bg-slate-700 text-slate-400 hover:text-white transition"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Video Screen Area */}
        <div className="relative aspect-video w-full bg-slate-950 overflow-hidden flex flex-col items-center justify-center">
          {mode === 'animasi' ? (
            /* BUILT-IN ANIMATED VIDEO SIMULATION */
            <div className="relative w-full h-full flex flex-col items-center justify-between p-6 select-none bg-gradient-to-b from-slate-900 via-indigo-950/70 to-slate-950">
              {/* Animated Canvas Graphics depending on topic */}
              <div className="flex-1 w-full flex items-center justify-center">
                {topicId.includes('pecahan') && (
                  <div className="flex items-center justify-center gap-6 sm:gap-8 animate-in fade-in">
                    {/* Visual 1: Half Pizza */}
                    <div className="text-center space-y-2">
                      <div className="relative w-28 sm:w-36 h-28 sm:h-36 rounded-full border-4 border-amber-400 bg-amber-200 overflow-hidden shadow-2xl flex items-center justify-center">
                        <div
                          className="absolute left-0 top-0 w-1/2 h-full bg-orange-500 border-r-2 border-white flex items-center justify-center text-white font-black text-lg sm:text-xl transition-all duration-500"
                        >
                          1/2
                        </div>
                        <div className="absolute right-3 text-slate-600 font-bold text-xs opacity-50">
                          kosong
                        </div>
                      </div>
                      <span className="inline-block text-xs font-bold bg-amber-400/20 text-amber-300 px-3 py-1 rounded-full border border-amber-400/40">
                        1 dari 2 Bagian
                      </span>
                    </div>

                    <div className="text-2xl sm:text-3xl font-black text-amber-400 font-display">
                      =
                    </div>

                    {/* Visual 2: Quarter Pizza */}
                    <div className="text-center space-y-2">
                      <div className="relative w-28 sm:w-36 h-28 sm:h-36 rounded-full border-4 border-amber-400 bg-amber-200 overflow-hidden shadow-2xl grid grid-cols-2 grid-rows-2">
                        <div className="bg-orange-500 border border-white flex items-center justify-center text-white font-black text-xs sm:text-sm">
                          1/4
                        </div>
                        <div className="bg-orange-500 border border-white flex items-center justify-center text-white font-black text-xs sm:text-sm">
                          1/4
                        </div>
                        <div className="bg-amber-200/40 border border-white flex items-center justify-center text-slate-500 font-bold text-xs opacity-40">
                          1/4
                        </div>
                        <div className="bg-amber-200/40 border border-white flex items-center justify-center text-slate-500 font-bold text-xs opacity-40">
                          1/4
                        </div>
                      </div>
                      <span className="inline-block text-xs font-bold bg-orange-400/20 text-orange-300 px-3 py-1 rounded-full border border-orange-400/40">
                        2 dari 4 Bagian (2/4)
                      </span>
                    </div>
                  </div>
                )}

                {topicId.includes('fotosintesis') && (
                  <div className="relative w-full max-w-lg h-52 flex items-center justify-around animate-in fade-in">
                    {/* Sun */}
                    <div className="text-center space-y-1 animate-pulse">
                      <div className="text-5xl">☀️</div>
                      <span className="text-3xs font-extrabold uppercase text-amber-300">Cahaya Surya</span>
                    </div>

                    {/* Leaf Kitchen */}
                    <div className="text-center space-y-2 relative">
                      <div className="text-7xl animate-bounce">🍃</div>
                      <div className="bg-emerald-500/20 text-emerald-300 border border-emerald-400/40 px-3 py-1 rounded-full text-xs font-bold">
                        Klorofil Memasak
                      </div>
                    </div>

                    {/* Results: Oxygen & Glucose */}
                    <div className="text-center space-y-2">
                      <div className="p-3 bg-cyan-500/20 border border-cyan-400/40 rounded-2xl space-y-1">
                        <div className="text-2xl">💨 O₂</div>
                        <span className="text-3xs font-bold text-cyan-300 block">Oksigen Segar</span>
                      </div>
                      <div className="p-2 bg-amber-500/20 border border-amber-400/40 rounded-xl">
                        <span className="text-3xs font-bold text-amber-300">🥔 Glukosa Makanan</span>
                      </div>
                    </div>
                  </div>
                )}

                {topicId.includes('vokal') && (
                  <div className="flex items-center justify-center gap-3 sm:gap-4 animate-in fade-in">
                    {['A', 'I', 'U', 'E', 'O'].map((huruf, idx) => (
                      <div
                        key={huruf}
                        className={`w-12 h-16 sm:w-16 sm:h-20 rounded-2xl flex flex-col items-center justify-center font-black text-2xl sm:text-3xl font-display shadow-xl transition-all duration-300 ${
                          progress >= idx * 20
                            ? 'bg-amber-400 text-slate-900 scale-110 shadow-amber-400/30 ring-4 ring-white'
                            : 'bg-slate-800 text-slate-400 opacity-60'
                        }`}
                      >
                        <span>{huruf}</span>
                        <span className="text-3xs font-mono font-normal">vokal</span>
                      </div>
                    ))}
                  </div>
                )}

                {topicId.includes('gotong-royong') && (
                  <div className="text-center space-y-4 animate-in fade-in">
                    <div className="flex items-center justify-center gap-4 text-4xl sm:text-5xl">
                      <span className="animate-bounce">🐜</span>
                      <span className="animate-bounce delay-100">🐜</span>
                      <span className="text-5xl sm:text-6xl p-2 bg-amber-500/20 rounded-2xl">🍰</span>
                      <span className="animate-bounce delay-200">🐜</span>
                      <span className="animate-bounce delay-300">🐜</span>
                    </div>
                    <div className="inline-block bg-white/10 px-4 py-1.5 rounded-full border border-white/20 text-xs font-bold text-amber-300">
                      🤝 Bersatu Kita Teguh • Berat Sama Dipikul, Ringan Sama Dijinjing
                    </div>
                  </div>
                )}

                {topicId.includes('lingkaran') && (
                  <div className="flex items-center justify-center gap-6 animate-in fade-in">
                    <div className="relative w-36 h-36 rounded-full border-4 border-dashed border-amber-400 flex items-center justify-center animate-spin-slow">
                      <div className="w-3 h-3 rounded-full bg-white" />
                      <div className="absolute right-0 top-1/2 -translate-y-1/2 w-1/2 h-0.5 bg-cyan-400" />
                      <span className="absolute bottom-2 text-2xs text-cyan-300 font-mono">r (jari-jari)</span>
                    </div>
                    <div className="text-left space-y-1">
                      <p className="text-xs font-bold text-amber-300">Keliling = π × d</p>
                      <p className="text-2xs text-slate-300">π ≈ 3,14 atau 22/7</p>
                    </div>
                  </div>
                )}

                {!topicId.includes('pecahan') &&
                  !topicId.includes('fotosintesis') &&
                  !topicId.includes('vokal') &&
                  !topicId.includes('gotong-royong') &&
                  !topicId.includes('lingkaran') && (
                    <div className="text-center space-y-3 animate-in fade-in">
                      <div className="text-6xl sm:text-7xl animate-bounce">
                        🌟
                      </div>
                      <h4 className="text-lg sm:text-xl font-black text-amber-300 font-display">
                        Eksplorasi Konsep {title}
                      </h4>
                      <p className="text-xs text-slate-300 max-w-sm">
                        Dengarkan narasi suara dan perhatikan animasi visual edukatif!
                      </p>
                    </div>
                  )}
              </div>

              {/* Subtitles & Captions Bar */}
              <div className="w-full bg-black/75 backdrop-blur-md p-3 sm:p-4 rounded-2xl border border-white/10 text-center max-w-2xl mx-auto min-h-[58px] flex items-center justify-center">
                <p className="text-xs sm:text-sm font-semibold text-amber-200 leading-snug">
                  {currentCaption || 'Klik tombol Putar (▶️) untuk memulai animasi video edukatif bersama suara pemandu!'}
                </p>
              </div>

              {/* Play Overlay if paused */}
              {!isPlaying && progress === 0 && (
                <div
                  onClick={handleTogglePlay}
                  className="absolute inset-0 bg-black/40 flex flex-col items-center justify-center cursor-pointer group"
                >
                  <div className="w-20 h-20 rounded-full bg-amber-500 group-hover:scale-110 flex items-center justify-center shadow-2xl transition duration-300 border-4 border-white/50">
                    <Play className="w-10 h-10 fill-slate-900 text-slate-900 ml-1.5" />
                  </div>
                  <span className="mt-3 text-xs font-black uppercase tracking-wider text-white bg-black/70 px-4 py-1.5 rounded-full border border-white/20 shadow-md">
                    Klik untuk Memutar Video Animasi 🔊
                  </span>
                </div>
              )}
            </div>
          ) : (
            /* YOUTUBE IFRAME PLAYER */
            <div className="w-full h-full">
              <iframe
                className="w-full h-full"
                src={`https://www.youtube.com/embed/${youtubeId}?autoplay=1&rel=0&modestbranding=1`}
                title={title}
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
              />
            </div>
          )}
        </div>

        {/* Video Control Bar (For Animated Mode) */}
        {mode === 'animasi' && (
          <div className="p-4 bg-slate-800 border-t border-slate-700 space-y-3">
            {/* Scrubber Progress Bar */}
            <div className="flex items-center gap-3 text-xs font-mono text-slate-400">
              <span className="w-10 text-right">{Math.round((progress / 100) * 35)}s</span>
              <div
                onClick={(e) => {
                  const rect = e.currentTarget.getBoundingClientRect();
                  const clickX = e.clientX - rect.left;
                  const newPct = Math.round((clickX / rect.width) * 100);
                  setProgress(Math.max(0, Math.min(100, newPct)));
                }}
                className="flex-1 bg-slate-700 h-2.5 rounded-full overflow-hidden cursor-pointer relative group"
              >
                <div
                  className="bg-amber-400 h-full rounded-full transition-all"
                  style={{ width: `${progress}%` }}
                />
              </div>
              <span className="w-10">35s</span>
            </div>

            {/* Playback Action Buttons */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <button
                  onClick={handleTogglePlay}
                  className="flex items-center gap-1.5 px-4 py-2 bg-amber-400 hover:bg-amber-500 text-slate-900 font-black rounded-xl text-xs transition active:scale-95"
                >
                  {isPlaying ? (
                    <>
                      <Pause className="w-4 h-4 fill-slate-900" />
                      <span>Jeda</span>
                    </>
                  ) : (
                    <>
                      <Play className="w-4 h-4 fill-slate-900" />
                      <span>Putar Video 🔊</span>
                    </>
                  )}
                </button>

                <button
                  onClick={handleRestart}
                  className="p-2 rounded-xl bg-slate-700 hover:bg-slate-600 text-white text-xs transition"
                  title="Putar Ulang dari Awal"
                >
                  <RotateCcw className="w-4 h-4" />
                </button>

                <button
                  onClick={() => {
                    if (!isMuted) voiceGuideService.stop();
                    setIsMuted(!isMuted);
                  }}
                  className={`p-2 rounded-xl transition ${
                    isMuted ? 'bg-rose-600 text-white' : 'bg-slate-700 hover:bg-slate-600 text-white'
                  }`}
                  title={isMuted ? 'Nyalakan Suara' : 'Bisukan Suara'}
                >
                  {isMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
                </button>
              </div>

              {hasCompleted && (
                <div className="flex items-center gap-1.5 text-xs font-bold text-amber-300 bg-amber-500/20 px-3 py-1.5 rounded-xl border border-amber-400/40 animate-pulse">
                  <Star className="w-4 h-4 fill-amber-400 text-amber-400" />
                  <span>Selesai Menonton! (+10 ⭐ Bintang)</span>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Post-Video Interactive Reflection */}
        <div className="p-5 bg-slate-900/90 border-t border-slate-800 space-y-4">
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-start gap-2.5">
              <span className="text-2xl">🤔</span>
              <div>
                <div className="flex items-center gap-2">
                  <h4 className="font-extrabold text-sm text-white">
                    Tantangan Refleksi Setelah Menonton
                  </h4>
                  <button
                    onClick={handleSpeakReflectionPrompt}
                    className="p-1 px-2.5 rounded-lg bg-amber-400/20 hover:bg-amber-400/30 text-amber-300 text-2xs font-bold flex items-center gap-1 border border-amber-400/40"
                  >
                    <Volume2 className="w-3 h-3" /> Dengarkan Pertanyaan 🔊
                  </button>
                </div>
                <p className="text-xs text-amber-200 mt-1 italic font-medium">
                  “{reflectionPrompt}”
                </p>
              </div>
            </div>
          </div>

          {!reflectionSubmitted ? (
            <form onSubmit={handleSubmitReflection} className="flex gap-2">
              <input
                type="text"
                value={studentReflectionText}
                onChange={(e) => setStudentReflectionText(e.target.value)}
                placeholder="Ceritakan dengan bahasamu: Apa yang baru saja kamu pelajari?"
                className="flex-1 text-xs p-3 rounded-xl bg-slate-800 border border-slate-700 text-white placeholder-slate-400 focus:outline-none focus:border-amber-400"
                required
              />
              <button
                type="submit"
                className="px-5 py-3 bg-amber-500 hover:bg-amber-600 text-slate-900 font-black text-xs rounded-xl shadow-md transition active:scale-95"
              >
                Kirim Refleksi 🚀
              </button>
            </form>
          ) : (
            <div className="p-3 bg-emerald-500/20 border border-emerald-500/40 rounded-xl text-emerald-300 text-xs font-bold flex items-center gap-2 animate-in fade-in">
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              <span>Hebat sekali! Cerita refleksimu tersimpan dan membuatmu semakin memahami materi! ⭐ +10 Bintang!</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
