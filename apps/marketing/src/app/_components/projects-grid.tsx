"use client";

import { motion } from "motion/react";
import Image from "next/image";
import Link from "next/link";
import { projects } from "@/app/lib/projects";
import { fadeUp, stagger } from "@/app/lib/motion";

export default function ProjectsGrid() {
  return (
    <section id="portfolio" className="bg-neutral-50 py-32">
      <motion.div
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true }}
        variants={stagger}
        className="max-w-7xl mx-auto px-6"
      >
        <motion.h2 variants={fadeUp} className="text-4xl font-bold mb-16">
          Projetos
        </motion.h2>
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-10">
          {projects.map((project) => (
            <motion.div key={project.slug} variants={fadeUp}>
              <Link
                href={`/projects/${project.slug}`}
                className="group block rounded-2xl overflow-hidden border hover:shadow-xl transition relative"
              >
                <Image
                  src={project.image}
                  alt={project.title}
                  width={600}
                  height={400}
                  className="group-hover:scale-105 transition"
                />
                {project.status === "in-development" && (
                  <span className="absolute top-3 right-3 px-2 py-1 rounded-full bg-amber-500 text-white text-xs font-medium">
                    Em breve
                  </span>
                )}
                <div className="p-6 space-y-2 bg-white">
                  <h3 className="text-xl font-semibold">{project.title}</h3>
                  <p className="text-sm text-neutral-500">
                    {project.shortDescription}
                  </p>
                </div>
              </Link>
            </motion.div>
          ))}
        </div>
      </motion.div>
    </section>
  );
}
