import React, { useState } from 'react';
import { Compass, Sparkles, MapPin, ChevronRight, Check } from 'lucide-react';

interface OnboardingProps {
    onComplete: () => void;
}

export default function Onboarding({ onComplete }: OnboardingProps) {
    const [currentStep, setCurrentStep] = useState(0);

    const slides = [
        {
            title: "대한민국 최고 대가들의\nAI 풍수 감명",
            description: "청풍 도사의 예리한 공간 진단과 명월 도사의 영험한 비방 처방을 지금 만나보세요. 당신의 공간에 숨겨진 길흉화복을 분석합니다.",
            icon: <Compass className="w-16 h-16 text-primary mb-6 animate-pulse-glow" />,
            image: "/images/masters/cheongpung.jpeg"
        },
        {
            title: "내 공간에 딱 맞는\n맞춤형 예술 비방",
            description: "부족한 기운은 채우고 넘치는 기운은 다스립니다. 영험한 기운이 담긴 디지털 아트워크와 12간지 비방 오브제를 통해 공간의 운기를 극대화하세요.",
            icon: <Sparkles className="w-16 h-16 text-primary mb-6" />,
            image: "/images/masters/myeongwol.jpeg"
        },
        {
            title: "지금 바로 시작하는\n운명 개선 프로젝트",
            description: "복잡한 절차 없이 주소와 사진만으로 대한민국 최고 수준의 풍수 컨설팅을 경험할 수 있습니다.",
            icon: <MapPin className="w-16 h-16 text-primary mb-6" />,
            image: null
        }
    ];

    const handleNext = () => {
        if (currentStep < slides.length - 1) {
            setCurrentStep(currentStep + 1);
        } else {
            // Save completion status to localStorage
            localStorage.setItem('PUNGSOO_ONBOARDING_COMPLETED', 'true');
            onComplete();
        }
    };

    return (
        <div className="fixed inset-0 z-[100] bg-background-dark flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-gradient-to-b from-[#4a443b]/40 to-background-dark pointer-events-none"></div>

            <div className="relative w-full max-w-md bg-[#221e10] rounded-3xl overflow-hidden shadow-2xl border border-primary/20 flex flex-col h-[600px] max-h-[90vh]">

                {/* Progress Bar */}
                <div className="flex gap-2 p-6 pb-0">
                    {slides.map((_, index) => (
                        <div
                            key={index}
                            className={`h-1.5 flex-1 rounded-full transition-all duration-500 ${index <= currentStep ? 'bg-primary' : 'bg-white/10'}`}
                        />
                    ))}
                </div>

                {/* Content */}
                <div className="flex-1 p-8 flex flex-col items-center justify-center text-center">
                    <div className="transition-opacity duration-300">
                        {slides[currentStep].image ? (
                            <img
                                src={slides[currentStep].image}
                                alt="Master"
                                className="w-32 h-32 rounded-full border-4 border-primary/30 object-cover mx-auto mb-8 shadow-xl"
                            />
                        ) : (
                            <div className="flex justify-center">
                                {slides[currentStep].icon}
                            </div>
                        )}

                        <h2 className="text-2xl md:text-3xl font-bold text-white mb-4 whitespace-pre-line leading-tight">
                            {slides[currentStep].title}
                        </h2>

                        <p className="text-slate-300 text-[15px] leading-relaxed relative z-10">
                            {slides[currentStep].description}
                        </p>
                    </div>
                </div>

                {/* Footer / Controls */}
                <div className="p-6 pt-0 mt-auto">
                    <button
                        onClick={handleNext}
                        className="w-full py-4 bg-gradient-to-r from-[#d4af37] to-[#c29d2f] text-white font-bold rounded-2xl flex items-center justify-center gap-2 hover:shadow-lg transition-transform hover:scale-[1.02] active:scale-95"
                    >
                        {currentStep === slides.length - 1 ? (
                            <>풍수 감명 시작하기 <Check className="w-5 h-5" /></>
                        ) : (
                            <>다음으로 <ChevronRight className="w-5 h-5" /></>
                        )}
                    </button>

                    {currentStep < slides.length - 1 && (
                        <button
                            onClick={() => {
                                localStorage.setItem('PUNGSOO_ONBOARDING_COMPLETED', 'true');
                                onComplete();
                            }}
                            className="w-full mt-4 py-2 text-slate-400 font-medium text-sm hover:text-white transition-colors"
                        >
                            건너뛰기
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
}
