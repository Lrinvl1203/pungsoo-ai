
import React, { useEffect } from 'react';

const htmlString = `
<div class="relative flex min-h-screen w-full flex-col group/design-root">
<!-- Navigation -->
<header class="fixed top-0 z-50 w-full border-b border-primary/20 bg-background-dark/80 backdrop-blur-md transition-all">
<div class="mx-auto flex h-20 max-w-7xl items-center justify-between px-6 lg:px-8">
<div class="flex items-center gap-4">
<div class="flex size-10 items-center justify-center rounded-full bg-primary/10 text-primary">
<span class="material-symbols-outlined text-2xl">temple_buddhist</span>
</div>
<h2 class="text-xl font-bold leading-tight tracking-tight text-white">Celestial Realm</h2>
</div>
<nav class="hidden md:flex flex-1 justify-center">
<ul class="flex items-center gap-8">
<li><a class="text-sm font-medium text-slate-300 transition-colors hover:text-primary" href="#">Story</a></li>
<li><a class="text-sm font-medium text-slate-300 transition-colors hover:text-primary" href="#">Characters</a></li>
<li><a class="text-sm font-medium text-slate-300 transition-colors hover:text-primary" href="#">World</a></li>
<li><a class="text-sm font-medium text-slate-300 transition-colors hover:text-primary" href="#">Lore</a></li>
</ul>
</nav>
<div class="flex items-center justify-end gap-4">
<button class="hidden md:flex h-10 items-center justify-center rounded-lg bg-primary px-6 text-sm font-bold text-background-dark transition-transform hover:scale-105 hover:bg-yellow-400 active:scale-95">
                        Read Now
                    </button>
<button class="flex md:hidden items-center justify-center text-white">
<span class="material-symbols-outlined">menu</span>
</button>
</div>
</div>
</header>
<!-- Main Hero Section -->
<main class="flex min-h-screen grow flex-col pt-20">
<div class="relative flex flex-1 flex-col items-center justify-center overflow-hidden p-4 md:p-10">
<!-- Background Image Layer -->
<div class="absolute inset-0 z-0 bg-cover bg-center bg-no-repeat" data-alt="floating hanok house in deep cosmic space" style='background-image: linear-gradient(to bottom, rgba(34, 30, 16, 0.4), rgba(34, 30, 16, 0.9)), url("https://lh3.googleusercontent.com/aida-public/AB6AXuCvWHIjiF4g5DNNRn-SXcwt2avj0BLQtkpRNkxzW4yaTcZygH6W75Mgm8xZfJMFwgDl3ZzUlc6mIm4DU7KMOq9ZA8y3P28VLj1AWm2fRSFz2W-eyaA8d3S-LT53x4KMyKZpWH97cfzWmHsYvjueHKf65AAHWn-QMjARhiNGq2m8jJxhg0Z_jHAroZMcVI7Cnqw_qBdC3swN5eLsbl34fGk8Nfx5AJ9q5f5qB6fz36r-sNjy-iST8wYDkl9viWeX0tRoiIMznIsyWmEx");'>
</div>
<!-- Content Container -->
<div class="relative z-10 flex w-full max-w-7xl flex-col items-center gap-8 text-center md:gap-12 lg:flex-row lg:text-left">
<!-- Text Content -->
<div class="flex flex-1 flex-col gap-6 lg:max-w-xl">
<div class="flex w-fit items-center gap-2 rounded-full border border-primary/30 bg-primary/10 px-4 py-1.5 backdrop-blur-sm">
<span class="material-symbols-outlined text-sm text-primary">auto_awesome</span>
<span class="text-xs font-bold uppercase tracking-wider text-primary">New Episodes Weekly</span>
</div>
<h1 class="text-5xl font-black leading-[1.1] tracking-tight text-white md:text-6xl lg:text-7xl">
                            The Celestial <span class="text-primary">Hanok</span>
</h1>
<p class="text-lg leading-relaxed text-slate-300 md:text-xl">
                            Step into a mystical webtoon universe where ancient tradition meets cosmic energy. Follow the path of Qi as it flows through the stars.
                        </p>
<div class="flex flex-col gap-4 sm:flex-row sm:items-center lg:justify-start">
<button class="group flex h-12 items-center justify-center gap-2 rounded-lg bg-primary px-8 text-base font-bold text-background-dark transition-all hover:bg-yellow-400">
<span>Start Reading</span>
<span class="material-symbols-outlined transition-transform group-hover:translate-x-1">arrow_forward</span>
</button>
<button class="group flex h-12 items-center justify-center gap-2 rounded-lg border border-slate-600 bg-background-dark/50 px-8 text-base font-bold text-white backdrop-blur-sm transition-all hover:border-primary hover:text-primary">
<span class="material-symbols-outlined">play_circle</span>
<span>Watch Trailer</span>
</button>
</div>
<div class="mt-8 flex items-center gap-4 text-sm text-slate-400">
<div class="flex -space-x-3">
<img alt="Reader" class="size-10 rounded-full border-2 border-background-dark bg-slate-700 object-cover" data-alt="User avatar 1" src="https://lh3.googleusercontent.com/aida-public/AB6AXuCi8N1-fKv3RhwA_H9Ei4I0EhfhGN-ARZkVFfZr7I1k7uhzuzyOkd287Uif1_ozU_5RFdntFn7I5iJEmEKqjYt1Sn2rqFPSLzAOjD8XMqMVAO0lB814ZgVYPYFHbo1N3RI8SdmBHpztHzcVLU1qrz9Cq7UanzQjJLG56iQMro0-qQnxxhjrbL1DWNXc1KtiC9UI2qGCa4OZbgJRvY4n8_dXyfYcazyBzXHI6PocIKmSnc0k2k4bstZAaeA2yQZJ9a9fRw-C0FBYm86i"/>
<img alt="Reader" class="size-10 rounded-full border-2 border-background-dark bg-slate-700 object-cover" data-alt="User avatar 2" src="https://lh3.googleusercontent.com/aida-public/AB6AXuDMVwjHsLkdf0IqAnDa9C_ctk1bUkvXQ50f1273qv3b-4QtipTXhcTXXekDCulF8lMWRataUyzSrTfaWDiO9UVmXzGJDbmLvH5-gMsXHFhnVt0IpjCAihbIU_c0hTM1u8s4Yro3ngtUYoQFp3kpB0zt2XSjhRpoxI24P3nBPRaSmmHIRuM9_497VRoshbYRh8gfKZ3RybPkjicnb_MDG6Sx_XS7NDcbxKcqRO7BiFf1GfGidSX7aaoP6vs-akzkx8I9PW1fMGkj8lZ-"/>
<img alt="Reader" class="size-10 rounded-full border-2 border-background-dark bg-slate-700 object-cover" data-alt="User avatar 3" src="https://lh3.googleusercontent.com/aida-public/AB6AXuAtgRwWWJjQxov62MLVxhBRXpEFCQxY8beF_FbQA32ckjaXt9Qxs6Tj_E-sozDVbW05nBxjGxj4kb_NyQCO24AWafCfEs1PDjQ8PX0WhpNDb6CaOMl4VxqOn4EnJIbFXzA830vofxBBzaIXHiF2oXtq5HsTuxIN5AZQcqUnNEivphqRGHXYkDGWkk1BXfUJloI5tZXLMUj0Ink4SWdk3MzAOZyN7o-y_85fZsN2mxSHjlAjI6pX0C792JYmfVLtkDdKFjnuhIRoG0Vr"/>
<div class="flex size-10 items-center justify-center rounded-full border-2 border-background-dark bg-slate-800 text-xs font-bold text-white">+2k</div>
</div>
<p>Join 2,000+ readers exploring the realm.</p>
</div>
</div>
<!-- Visual/Card Element -->
<div class="flex flex-1 items-center justify-center perspective-1000 lg:justify-end">
<div class="relative w-full max-w-md overflow-hidden rounded-2xl border border-white/10 bg-white/5 p-4 backdrop-blur-md shadow-2xl transition-transform hover:scale-[1.02] duration-500 group">
<!-- Image container -->
<div class="relative aspect-[3/4] overflow-hidden rounded-xl bg-slate-900">
<div class="absolute inset-0 bg-cover bg-center transition-transform duration-700 group-hover:scale-110" data-alt="Manhwa character looking at floating hanok" style='background-image: url("https://lh3.googleusercontent.com/aida-public/AB6AXuCMH1dkDBAuGX0rlROJAD5muLnUVHAMKEaugNqMiaHMawXwts5-r1Xfaz6oSXbNiezAbgsK6xewhyhWVs2plfvSCyHGPCDL4oKyy2iI_RRXbK6ZRP-35qRsSNWQ02R-Xi9Ik2AIoJ7s2VxPq6ERCfcPEeacvGvdahUJdisVGPTveURZQpL3bxrbqal27hT0MPdtcuedYNUtZlEzZpOJCbiq4mAaTtYI7dXir9BUChzIVKZwE50XdlMKJw3QpK-4lKD-UnaREfaT7IqE");'>
</div>
<!-- Overlay Gradient -->
<div class="absolute inset-0 bg-gradient-to-t from-background-dark via-background-dark/20 to-transparent opacity-90"></div>
<!-- Card Content -->
<div class="absolute bottom-0 left-0 w-full p-6">
<div class="mb-2 flex items-center justify-between">
<span class="rounded bg-primary px-2 py-0.5 text-xs font-bold uppercase text-background-dark">Episode 1</span>
<span class="flex items-center gap-1 text-xs text-primary">
<span class="material-symbols-outlined text-[14px]">star</span>
                                            4.9
                                        </span>
</div>
<h3 class="mb-1 text-2xl font-bold text-white">Awakening of the Void</h3>
<p class="text-sm text-slate-300 line-clamp-2">
                                        Jin discovers the ancient scroll hidden within the floating temple, unlocking powers forbidden for centuries.
                                    </p>
</div>
</div>
<!-- Decorative glow behind -->
<div class="absolute -inset-1 -z-10 rounded-2xl bg-gradient-to-r from-primary/30 to-purple-600/30 blur-xl opacity-50 transition-opacity group-hover:opacity-100"></div>
</div>
</div>
</div>
</div>
<!-- Bottom Ticker / Stats -->
<div class="border-t border-white/10 bg-background-dark/80 backdrop-blur text-white">
<div class="mx-auto flex max-w-7xl flex-wrap justify-between gap-8 px-6 py-6 lg:px-8">
<div class="flex items-center gap-3">
<span class="flex size-10 items-center justify-center rounded-lg bg-white/5 text-primary">
<span class="material-symbols-outlined">menu_book</span>
</span>
<div>
<p class="text-2xl font-bold leading-none">124</p>
<p class="text-xs text-slate-400 uppercase tracking-wider">Episodes</p>
</div>
</div>
<div class="flex items-center gap-3">
<span class="flex size-10 items-center justify-center rounded-lg bg-white/5 text-primary">
<span class="material-symbols-outlined">visibility</span>
</span>
<div>
<p class="text-2xl font-bold leading-none">8.5M</p>
<p class="text-xs text-slate-400 uppercase tracking-wider">Views</p>
</div>
</div>
<div class="flex items-center gap-3">
<span class="flex size-10 items-center justify-center rounded-lg bg-white/5 text-primary">
<span class="material-symbols-outlined">favorite</span>
</span>
<div>
<p class="text-2xl font-bold leading-none">942K</p>
<p class="text-xs text-slate-400 uppercase tracking-wider">Likes</p>
</div>
</div>
<div class="hidden md:flex items-center gap-3 border-l border-white/10 pl-8">
<p class="text-sm font-medium text-slate-300">Latest update:</p>
<span class="text-sm font-bold text-primary">Today, 14:00 KST</span>
</div>
</div>
</div>
</main>
</div>
`;

const ConceptTest: React.FC = () => {
    useEffect(() => {
        // Inject Google Fonts
        const link1 = document.createElement('link');
        link1.href = 'https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;700;800;900&display=swap';
        link1.rel = 'stylesheet';
        document.head.appendChild(link1);

        const link2 = document.createElement('link');
        link2.href = 'https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:wght,FILL@100..700,0..1&display=swap';
        link2.rel = 'stylesheet';
        document.head.appendChild(link2);

        // Inject Tailwind classes specifically for this test page dynamically
        const script1 = document.createElement('script');
        script1.src = 'https://cdn.tailwindcss.com?plugins=forms,container-queries';
        document.head.appendChild(script1);

        const script2 = document.createElement('script');
        script2.innerHTML = `
            tailwind.config = {
                darkMode: "class",
                theme: {
                    extend: {
                        colors: {
                            "primary": "#f2b90d",
                            "background-light": "#f8f8f5",
                            "background-dark": "#221e10",
                        },
                        fontFamily: {
                            "display": ["Plus Jakarta Sans", "sans-serif"]
                        },
                        borderRadius: {
                            "DEFAULT": "0.25rem",
                            "lg": "0.5rem",
                            "xl": "0.75rem",
                            "full": "9999px"
                        },
                    },
                },
            }
        `;
        document.head.appendChild(script2);

        // Store original class
        const originalHtmlClass = document.documentElement.className;
        document.documentElement.className = 'dark';

        return () => {
            if (document.head.contains(link1)) document.head.removeChild(link1);
            if (document.head.contains(link2)) document.head.removeChild(link2);
            if (document.head.contains(script1)) document.head.removeChild(script1);
            if (document.head.contains(script2)) document.head.removeChild(script2);
            document.documentElement.className = originalHtmlClass;
        };
    }, []);

    return (
        <div
            className="bg-background-light dark:bg-background-dark font-display text-slate-900 dark:text-slate-100 antialiased overflow-x-hidden min-h-screen"
            dangerouslySetInnerHTML={{ __html: htmlString }}
        />
    );
};

export default ConceptTest;
