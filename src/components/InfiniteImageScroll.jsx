// src/components/InfiniteImageScroll.jsx
'use client'; // Required for hooks like useEffect, useRef

import React, { useEffect, useRef } from 'react';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { ScrollToPlugin } from 'gsap/ScrollToPlugin';
import './InfiniteImageScroll.css'; // Make sure this CSS styles the 'li' elements appropriately (size, aspect ratio, etc.)

// Register GSAP plugins
gsap.registerPlugin(ScrollTrigger, ScrollToPlugin);

function InfiniteImageScroll() {
    const galleryRef = useRef(null);
    const cardRefs = useRef([]);
    const nextButtonRef = useRef(null);
    const prevButtonRef = useRef(null);

    // --- Configuration for Your Images ---
    const numberOfImages = 22; // How many images do you have?
    const imagePathPrefix = '/nfts/'; // The folder *inside* the 'public' directory
    // List your image filenames here. Order matters for the scroll sequence.
    const imageFilenames = [
        "../assets/ape1.jpeg",
        "../assets/ape2.jpeg",
        "../assets/ape3.jpeg",
        "../assets/ape4.jpeg",
        "../assets/ape5.jpeg",
        "../assets/ape6.jpeg",
        "../assets/ape7.jpeg",
        "../assets/img1.jpeg",
        "../assets/img3.jpeg",
        "../assets/img4.jpeg",
        "../assets/img5.jpeg",
        "../assets/img6.jpeg",
        "../assets/img7.jpeg",
        "../assets/img8.jpeg",
        "../assets/img9.jpeg",
        "../assets/img10.jpeg",
        "../assets/img11.jpeg",
        "../assets/img12.jpeg",
        "../assets/img13.jpeg",
        "../assets/img14.jpeg",
        "../assets/img15.jpeg",
        "../assets/img16.jpeg",
        // Add more filenames if numberOfImages is greater than 12
    ];

    // --- Generate the cardData array with full image paths ---
    const cardData = imageFilenames.slice(0, numberOfImages).map(filename => `${imagePathPrefix}${filename}`);

    // --- OR --- If your images are sequentially named (e.g., image-1.jpg, image-2.jpg):
    /*
    const numberOfImages = 12;
    const imagePathPrefix = '/nfts/'; // Path within the public folder
    const imageBaseName = 'image-'; // Base part of the filename
    const imageExtension = '.jpg'; // Or .png, .webp, etc.

    const cardData = Array.from(
        { length: numberOfImages },
        (_, i) => `${imagePathPrefix}${imageBaseName}${i + 1}${imageExtension}`
    );
    */
    // --- End Image Configuration ---


    useEffect(() => {
        if (!galleryRef.current) {
            console.warn("Gallery ref not ready.");
            return;
        }

        // Ensure refs are cleared before collecting new ones on re-render/mount
        cardRefs.current = [];
        // Force ref collection immediately after render before GSAP setup
        galleryRef.current.querySelectorAll('ul.cards > li').forEach(el => {
            if (el && !cardRefs.current.includes(el)) {
                cardRefs.current.push(el);
            }
        });


        const cards = cardRefs.current;

        if (cards.length !== cardData.length) {
             console.warn(`Card refs mismatch. Expected ${cardData.length}, got ${cards.length}. GSAP setup aborted.`);
            return;
        }
        if (cards.length === 0) {
            console.warn("No card refs found. GSAP setup aborted.");
            return;
        }


        let iteration = 0;
        const spacing = 0.1;
        const snap = gsap.utils.snap(spacing);

        function buildSeamlessLoop(items, spacing) {
            if (!items || items.length === 0) {
                console.error("buildSeamlessLoop received empty or invalid items array.");
                return null;
            }

            let overlap = Math.ceil(1 / spacing);
            // Ensure overlap doesn't exceed item count if spacing is large
            overlap = Math.min(overlap, items.length);

            let startTime = items.length * spacing + 0.5;
            let loopTime = (items.length + overlap) * spacing + 1;
            let rawSequence = gsap.timeline({ paused: true });
            let seamlessLoop = gsap.timeline({
                paused: true,
                repeat: -1,
                onRepeat() {
                    this._time === this._dur && (this._tTime += this._dur - 0.01);
                    iteration++;
                },
                onReverseComplete: () => iteration--
            });
            let l = items.length + overlap * 2;
            let time = 0, i, index, item;

            gsap.set(items, { xPercent: 400, opacity: 0, scale: 0, overwrite: true });

            for (i = 0; i < l; i++) {
                index = i % items.length;
                item = items[index];
                if (!item || typeof item.tagName !== 'string') {
                    console.warn(`Skipping invalid item at index ${index} during animation setup.`);
                    continue;
                }
                time = i * spacing;
                rawSequence.fromTo(item,
                                   { scale: 0, opacity: 0 },
                                   { scale: 1, opacity: 1, zIndex: 100, duration: 0.5, yoyo: true, repeat: 1, ease: "power1.in", immediateRender: false },
                                   time)
                           .fromTo(item,
                                   { xPercent: 400 },
                                   { xPercent: -400, duration: 1, ease: "none", immediateRender: false },
                                   time);
                // i <= items.length && seamlessLoop.add("label" + i, time); // Optional labels
            }

            // Adjust start/loop times if overlap caused issues
            if (startTime < 0) startTime = 0;
            if (loopTime <= startTime) loopTime = startTime + items.length * spacing; // Ensure loopTime is valid


            rawSequence.time(startTime);

            // Check if rawSequence duration is valid before proceeding
             if (rawSequence.duration() <= 0 || loopTime <= startTime) {
                 console.error("Invalid sequence duration or times. Cannot create seamless loop.");
                 rawSequence.kill(); // Clean up the invalid sequence
                 return null;
             }

            seamlessLoop.to(rawSequence, {
                time: loopTime,
                duration: loopTime - startTime,
                ease: "none"
            }).fromTo(rawSequence, { time: overlap * spacing + 1 }, {
                time: startTime,
                duration: startTime - (overlap * spacing + 1),
                immediateRender: false,
                ease: "none"
            });

            return seamlessLoop;
        }

        const seamlessLoop = buildSeamlessLoop(cards, spacing);

        if (!seamlessLoop) {
            console.error("Failed to build seamless loop timeline.");
            return;
        }

        const scrub = gsap.to(seamlessLoop, {
            totalTime: 0,
            duration: 0.5,
            ease: "power3",
            paused: true
        });

        const trigger = ScrollTrigger.create({
            trigger: galleryRef.current,
            start: "top top",
            end: "+=2500", // Increased scroll distance slightly
            pin: true,
            // anticipatePin: 1, // Consider removing if still jittery
            onUpdate(self) {
                if (seamlessLoop.duration() > 0) {
                    const progress = self.progress;
                    // Ensure progress is clamped between 0 and 1
                    const clampedProgress = Math.max(0, Math.min(1, progress));
                    const targetTime = snap(clampedProgress * seamlessLoop.duration());
                    scrub.vars.totalTime = targetTime;
                    scrub.invalidate().restart();
                } else {
                    // console.warn("Seamless loop duration is zero, cannot scrub.");
                }
            },
        });

        function scrollToTime(time) {
            if (!seamlessLoop || seamlessLoop.duration() <= 0 || !trigger) {
                console.warn("Cannot scroll to time, dependencies missing or invalid.");
                return;
            }
            const wrappedTime = gsap.utils.wrap(0, seamlessLoop.duration(), time);
            const progress = wrappedTime / seamlessLoop.duration();
            const scrollPos = trigger.start + progress * (trigger.end - trigger.start);

            gsap.to(window, {
                scrollTo: { y: scrollPos, autoKill: true },
                duration: 0.7,
                ease: "power2.out",
                overwrite: "auto"
            });
        }

        const handleNext = () => {
            if (seamlessLoop && scrub) {
                scrollToTime(scrub.vars.totalTime + spacing);
            }
        };

        const handlePrev = () => {
            if (seamlessLoop && scrub) {
                scrollToTime(scrub.vars.totalTime - spacing);
            }
        };

        const nextBtn = nextButtonRef.current;
        const prevBtn = prevButtonRef.current;

        nextBtn?.addEventListener('click', handleNext);
        prevBtn?.addEventListener('click', handlePrev);

        // --- Cleanup ---
        return () => {
            console.log("Cleaning up GSAP instances...");
            trigger?.kill();
            scrub?.kill();
            seamlessLoop?.kill();
            // No need to kill rawSequence explicitly if it's local to buildSeamlessLoop

            nextBtn?.removeEventListener('click', handleNext);
            prevBtn?.removeEventListener('click', handlePrev);

            // Reset refs array
            cardRefs.current = [];
        };

    }, [cardData]); // Re-run effect if cardData array itself changes (e.g., different images loaded)

    // Ref collector function (stable)
    const addToRefs = (el) => {
        if (el && !cardRefs.current.includes(el)) {
            cardRefs.current.push(el);
        }
    };

    return (
        <div className="gallery" ref={galleryRef}>
            <ul className="cards">
                {cardData.map((imageUrl, index) => (
                    // Assign ref directly here - simpler than querying after render
                    <li key={imageUrl || index} ref={addToRefs}>
                        <img
                            src={imageUrl}
                            alt={`NFT Image ${index + 1}`} // Provide descriptive alt text if possible
                            style={{
                                width: '100%',
                                height: '100%',
                                objectFit: 'cover', // Crucial for aspect ratio
                                borderRadius: 'inherit' // Inherit border-radius from the 'li'
                            }}
                            loading="lazy" // Improve initial load performance
                        />
                    </li>
                ))}
            </ul>
            <div className="actions">
                <button className="prev" ref={prevButtonRef}>Prev</button>
                <button className="next" ref={nextButtonRef}>Next</button>
            </div>
        </div>
    );
}

export default InfiniteImageScroll;