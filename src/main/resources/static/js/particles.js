// ==================== Three.js Particle Background ====================
class ParticleBackground {
    constructor() {
        this.container = document.getElementById('particles-canvas');
        if (!this.container) return;
        
        this.scene = null;
        this.camera = null;
        this.renderer = null;
        this.particles = null;
        this.mouseX = 0;
        this.mouseY = 0;
        this.windowHalfX = window.innerWidth / 2;
        this.windowHalfY = window.innerHeight / 2;
        this.clock = new THREE.Clock();
        
        this.init();
        this.animate();
        this.setupEventListeners();
    }
    
    init() {
        // Scene
        this.scene = new THREE.Scene();
        
        // Camera
        this.camera = new THREE.PerspectiveCamera(
            75,
            window.innerWidth / window.innerHeight,
            1,
            2000
        );
        this.camera.position.z = 1000;
        
        // Particle count based on screen size - increased for better visual
        const particleCount = window.innerWidth < 768 ? 8000 : 50000;
        
        // Geometry
        const geometry = new THREE.BufferGeometry();
        const positions = new Float32Array(particleCount * 3);
        const colors = new Float32Array(particleCount * 3);
        const sizes = new Float32Array(particleCount);
        
        // Detect current theme and set appropriate colors
        const isDark = document.documentElement.getAttribute('data-theme') !== 'light';
        
        // Light mode: black/dark grays | Dark mode: indigo/violet/purple
        const primaryColor = isDark ? new THREE.Color(0x6366f1) : new THREE.Color(0x1a1a1a);
        const secondaryColor = isDark ? new THREE.Color(0x8b5cf6) : new THREE.Color(0x333333);
        const accentColor = isDark ? new THREE.Color(0xa855f7) : new THREE.Color(0x4a4a4a);
        
        for (let i = 0; i < particleCount; i++) {
            const i3 = i * 3;
            
            // Position - spread particles in a 3D space
            positions[i3] = (Math.random() - 0.5) * 2000;
            positions[i3 + 1] = (Math.random() - 0.5) * 2000;
            positions[i3 + 2] = (Math.random() - 0.5) * 2000;
            
            // Colors - mix between theme colors
            const colorChoice = Math.random();
            let color;
            if (colorChoice < 0.33) {
                color = primaryColor;
            } else if (colorChoice < 0.66) {
                color = secondaryColor;
            } else {
                color = accentColor;
            }
            
            colors[i3] = color.r;
            colors[i3 + 1] = color.g;
            colors[i3 + 2] = color.b;
            
            // Sizes - vary particle sizes
            sizes[i] = Math.random() * 3 + 1;
        }
        
        geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
        geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));
        geometry.setAttribute('size', new THREE.BufferAttribute(sizes, 1));
        
        // Shader Material for better looking particles
        const material = new THREE.ShaderMaterial({
            uniforms: {
                time: { value: 0 },
                pixelRatio: { value: Math.min(window.devicePixelRatio, 2) }
            },
            vertexShader: `
                attribute float size;
                varying vec3 vColor;
                uniform float time;
                uniform float pixelRatio;
                
                void main() {
                    vColor = color;
                    vec3 pos = position;
                    
                    // Add subtle wave motion
                    pos.x += sin(time * 0.5 + position.y * 0.01) * 20.0;
                    pos.y += cos(time * 0.3 + position.x * 0.01) * 20.0;
                    pos.z += sin(time * 0.4 + position.z * 0.01) * 15.0;
                    
                    vec4 mvPosition = modelViewMatrix * vec4(pos, 1.0);
                    gl_PointSize = size * pixelRatio * (300.0 / -mvPosition.z);
                    gl_Position = projectionMatrix * mvPosition;
                }
            `,
            fragmentShader: `
                varying vec3 vColor;
                
                void main() {
                    // Create circular particles with soft edges
                    vec2 xy = gl_PointCoord.xy - vec2(0.5);
                    float ll = length(xy);
                    
                    if (ll > 0.5) discard;
                    
                    float alpha = 1.0 - smoothstep(0.3, 0.5, ll);
                    gl_FragColor = vec4(vColor, alpha * 0.6);
                }
            `,
            transparent: true,
            vertexColors: true,
            blending: THREE.AdditiveBlending,
            depthWrite: false
        });
        
        // Create particle system
        this.particles = new THREE.Points(geometry, material);
        this.scene.add(this.particles);
        
        // Renderer
        this.renderer = new THREE.WebGLRenderer({
            canvas: this.container,
            antialias: true,
            alpha: true
        });
        this.renderer.setSize(window.innerWidth, window.innerHeight);
        this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
        this.renderer.setClearColor(0x000000, 0);
    }
    
    setupEventListeners() {
        // Mouse move for interactive effect
        document.addEventListener('mousemove', (e) => {
            this.mouseX = (e.clientX - this.windowHalfX) * 0.5;
            this.mouseY = (e.clientY - this.windowHalfY) * 0.5;
        });
        
        // Touch move for mobile
        document.addEventListener('touchmove', (e) => {
            if (e.touches.length === 1) {
                this.mouseX = (e.touches[0].clientX - this.windowHalfX) * 0.5;
                this.mouseY = (e.touches[0].clientY - this.windowHalfY) * 0.5;
            }
        });
        
        // Resize handler
        window.addEventListener('resize', () => {
            this.windowHalfX = window.innerWidth / 2;
            this.windowHalfY = window.innerHeight / 2;
            
            this.camera.aspect = window.innerWidth / window.innerHeight;
            this.camera.updateProjectionMatrix();
            
            this.renderer.setSize(window.innerWidth, window.innerHeight);
            this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
        });
    }
    
    animate() {
        requestAnimationFrame(() => this.animate());
        
        const time = this.clock.getElapsedTime();
        
        // Update shader time uniform
        if (this.particles && this.particles.material.uniforms) {
            this.particles.material.uniforms.time.value = time;
        }
        
        // Smooth camera movement following mouse
        this.camera.position.x += (this.mouseX - this.camera.position.x) * 0.02;
        this.camera.position.y += (-this.mouseY - this.camera.position.y) * 0.02;
        this.camera.lookAt(this.scene.position);
        
        // Rotate particle system slowly
        if (this.particles) {
            this.particles.rotation.y = time * 0.05;
            this.particles.rotation.x = time * 0.02;
        }
        
        this.renderer.render(this.scene, this.camera);
    }
    
    // Update colors based on theme
    updateColors(isDark) {
        if (!this.particles) return;
        
        const colors = this.particles.geometry.attributes.color.array;
        const particleCount = colors.length / 3;
        
        // Light mode: black/dark grays | Dark mode: indigo/violet/purple
        const primaryColor = isDark ? new THREE.Color(0x818cf8) : new THREE.Color(0x1a1a1a);
        const secondaryColor = isDark ? new THREE.Color(0xa78bfa) : new THREE.Color(0x333333);
        const accentColor = isDark ? new THREE.Color(0xc084fc) : new THREE.Color(0x4a4a4a);
        
        for (let i = 0; i < particleCount; i++) {
            const i3 = i * 3;
            const colorChoice = Math.random();
            let color;
            
            if (colorChoice < 0.33) {
                color = primaryColor;
            } else if (colorChoice < 0.66) {
                color = secondaryColor;
            } else {
                color = accentColor;
            }
            
            colors[i3] = color.r;
            colors[i3 + 1] = color.g;
            colors[i3 + 2] = color.b;
        }
        
        this.particles.geometry.attributes.color.needsUpdate = true;
    }
}

// Initialize particles when DOM is ready
let particleBackground = null;

document.addEventListener('DOMContentLoaded', () => {
    // Small delay to ensure Three.js is loaded
    setTimeout(() => {
        if (typeof THREE !== 'undefined') {
            particleBackground = new ParticleBackground();
        }
    }, 100);
});

// Function to update particle colors on theme change
function updateParticleTheme(isDark) {
    if (particleBackground) {
        particleBackground.updateColors(isDark);
    }
}
