"use client";

import { useEffect, useRef, useState } from "react";

const possibilities = [
  {
    title: "Give small teams time back",
    text: "Automate repetitive bookings, follow-ups, stock updates, and paperwork.",
  },
  {
    title: "Make useful data easier to see",
    text: "Turn spreadsheets and records into clear dashboards and timely decisions.",
  },
  {
    title: "Notice problems earlier",
    text: "Use sensors and AI to spot changes in water, power, air, or equipment.",
  },
  {
    title: "Make learning more accessible",
    text: "Build tools that translate, caption, and explain useful information.",
  },
];

export function SkillsPlayground() {
  const root = useRef<HTMLElement>(null);

  return (
    <section
      id="skills-playground"
      ref={root}
      className={`skills-cinema`}
      aria-labelledby="skills-cinema-title"
    >
      <div className="ref-container">
        <div className="skills-cinema-heading">
          <div>
            <span className="maker-kicker">SKILLS FOR A CHANGING WORLD</span>
            <h2 id="skills-cinema-title">
              A little skill.
              <br />
              <i>A lot of possibility.</i>
            </h2>
          </div>
          <div className="skills-cinema-intro">
            <p>
              Modern AI makes it possible to do more with practical skills,
              curiosity, and good judgment. Here are some problems worth
              solving.
            </p>
            <span>Ideas to adapt for real people and local needs.</span>
          </div>
        </div>
      </div>
    </section>
  );
}
