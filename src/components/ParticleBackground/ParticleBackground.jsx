import React, { useEffect, useRef } from 'react';
import styles from './ParticleBackground.module.scss';

const ParticleBackground = () => {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    let animationFrameId;
    let particles = [];
    let mouse = { x: null, y: null, radius: 150 };

    // Set canvas size
    const resizeCanvas = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);

    // Mouse interaction
    const handleMouseMove = (e) => {
      mouse.x = e.clientX;
      mouse.y = e.clientY;
    };
    const handleMouseLeave = () => {
      mouse.x = null;
      mouse.y = null;
    };
    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseleave', handleMouseLeave);

    // Enhanced Particle class
    class Particle {
      constructor() {
        this.x = Math.random() * canvas.width;
        this.y = Math.random() * canvas.height;
        this.z = Math.random() * 1500;
        this.baseVx = (Math.random() - 0.5) * 1.5;
        this.baseVy = (Math.random() - 0.5) * 1.5;
        this.baseVz = (Math.random() - 0.5) * 4;
        this.vx = this.baseVx;
        this.vy = this.baseVy;
        this.vz = this.baseVz;
        this.size = Math.random() * 2.5 + 1;
        this.color = this.getColor();
        this.pulsePhase = Math.random() * Math.PI * 2;
        this.pulseSpeed = 0.02 + Math.random() * 0.03;
      }

      getColor() {
        const colors = [
          { r: 138, g: 43, b: 226, a: 0.9 },   // Purple
          { r: 160, g: 80, b: 240, a: 0.8 },   // Light Purple
          { r: 120, g: 30, b: 200, a: 0.85 },  // Dark Purple
          { r: 200, g: 150, b: 255, a: 0.7 }   // Lavender
        ];
        return colors[Math.floor(Math.random() * colors.length)];
      }

      update() {
        // Mouse interaction
        if (mouse.x !== null && mouse.y !== null) {
          const dx = mouse.x - this.x;
          const dy = mouse.y - this.y;
          const distance = Math.sqrt(dx * dx + dy * dy);
          
          if (distance < mouse.radius) {
            const force = (mouse.radius - distance) / mouse.radius;
            const angle = Math.atan2(dy, dx);
            this.vx -= Math.cos(angle) * force * 0.5;
            this.vy -= Math.sin(angle) * force * 0.5;
          }
        }

        // Apply velocity with damping
        this.vx += (this.baseVx - this.vx) * 0.05;
        this.vy += (this.baseVy - this.vy) * 0.05;
        this.vz += (this.baseVz - this.vz) * 0.05;

        this.x += this.vx;
        this.y += this.vy;
        this.z += this.vz;

        // Wrap around edges
        if (this.x < -50) this.x = canvas.width + 50;
        if (this.x > canvas.width + 50) this.x = -50;
        if (this.y < -50) this.y = canvas.height + 50;
        if (this.y > canvas.height + 50) this.y = -50;
        if (this.z < 0) this.z = 1500;
        if (this.z > 1500) this.z = 0;

        // Update pulse
        this.pulsePhase += this.pulseSpeed;
      }

      draw() {
        const scale = 1500 / (1500 + this.z);
        const x2d = (this.x - canvas.width / 2) * scale + canvas.width / 2;
        const y2d = (this.y - canvas.height / 2) * scale + canvas.height / 2;
        const size = this.size * scale;

        // Simple particle - no glow for performance
        ctx.beginPath();
        ctx.arc(x2d, y2d, size, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(${this.color.r}, ${this.color.g}, ${this.color.b}, ${this.color.a * 0.6})`;
        ctx.fill();
      }
    }

    // Reduce particles for performance
    const particleCount = 50;
    for (let i = 0; i < particleCount; i++) {
      particles.push(new Particle());
    }

    // Simplified connections - no gradients for performance
    const drawConnections = () => {
      const maxDistance = 150;
      for (let i = 0; i < particles.length; i++) {
        for (let j = i + 1; j < particles.length; j++) {
          const dx = particles[i].x - particles[j].x;
          const dy = particles[i].y - particles[j].y;
          const dz = particles[i].z - particles[j].z;
          const distance = Math.sqrt(dx * dx + dy * dy + dz * dz * 0.1);

          if (distance < maxDistance) {
            const scale1 = 1500 / (1500 + particles[i].z);
            const scale2 = 1500 / (1500 + particles[j].z);
            
            const x1 = (particles[i].x - canvas.width / 2) * scale1 + canvas.width / 2;
            const y1 = (particles[i].y - canvas.height / 2) * scale1 + canvas.height / 2;
            const x2 = (particles[j].x - canvas.width / 2) * scale2 + canvas.width / 2;
            const y2 = (particles[j].y - canvas.height / 2) * scale2 + canvas.height / 2;

            const opacity = (1 - distance / maxDistance) * 0.2;

            ctx.beginPath();
            ctx.moveTo(x1, y1);
            ctx.lineTo(x2, y2);
            ctx.strokeStyle = `rgba(138, 43, 226, ${opacity})`;
            ctx.lineWidth = 0.5;
            ctx.stroke();
          }
        }
      }
    };

    // Simple animation loop - no trail effect
    const animate = () => {
      // Clear canvas completely for better performance
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      // Draw connections first
      drawConnections();

      // Update and draw particles
      particles.forEach(particle => {
        particle.update();
        particle.draw();
      });

      animationFrameId = requestAnimationFrame(animate);
    };

    animate();

    // Cleanup
    return () => {
      window.removeEventListener('resize', resizeCanvas);
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseleave', handleMouseLeave);
      cancelAnimationFrame(animationFrameId);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className={styles.particleCanvas}
      aria-hidden="true"
    />
  );
};

export default ParticleBackground;
