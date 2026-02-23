import * as THREE from 'https://esm.sh/three@0.170.0';

export function createParticles(scene) {
  const COUNT = 800;

  // Positions — spherical distribution around face
  const positions = new Float32Array(COUNT * 3);
  const sizes = new Float32Array(COUNT);
  const randoms = new Float32Array(COUNT);

  for (let i = 0; i < COUNT; i++) {
    const i3 = i * 3;
    // Spherical coordinates
    const radius = 2 + Math.random() * 3.5;
    const theta = Math.random() * Math.PI * 2;
    const phi = Math.acos(2 * Math.random() - 1);

    positions[i3]     = radius * Math.sin(phi) * Math.cos(theta);
    positions[i3 + 1] = radius * Math.sin(phi) * Math.sin(theta);
    positions[i3 + 2] = radius * Math.cos(phi);

    sizes[i] = Math.random() * 3 + 1;
    randoms[i] = Math.random();
  }

  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
  geometry.setAttribute('aSize', new THREE.BufferAttribute(sizes, 1));
  geometry.setAttribute('aRandom', new THREE.BufferAttribute(randoms, 1));

  // Custom shader material for distance-based color
  const material = new THREE.ShaderMaterial({
    uniforms: {
      uTime: { value: 0 },
      uPixelRatio: { value: Math.min(window.devicePixelRatio, 2) },
    },
    vertexShader: /* glsl */`
      attribute float aSize;
      attribute float aRandom;
      uniform float uTime;
      uniform float uPixelRatio;

      varying float vDist;
      varying float vRandom;

      void main() {
        vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
        vDist = length(position) / 5.5;
        vRandom = aRandom;

        // Subtle pulsing
        float pulse = sin(uTime * 0.8 + aRandom * 6.28) * 0.3 + 1.0;
        gl_PointSize = aSize * uPixelRatio * pulse * (1.0 / -mvPosition.z);
        gl_Position = projectionMatrix * mvPosition;
      }
    `,
    fragmentShader: /* glsl */`
      varying float vDist;
      varying float vRandom;
      uniform float uTime;

      void main() {
        // Circular point
        float dist = length(gl_PointCoord - 0.5);
        if (dist > 0.5) discard;

        float alpha = 1.0 - dist * 2.0;
        alpha *= 0.8;

        // モノクロ: 距離とランダムで明度だけ変化
        float brightness = mix(0.25, 0.85, vRandom * 0.6 + (1.0 - vDist) * 0.4);
        vec3 color = vec3(brightness);

        gl_FragColor = vec4(color, alpha);
      }
    `,
    transparent: true,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
  });

  const particles = new THREE.Points(geometry, material);
  scene.add(particles);

  function tick(elapsed) {
    material.uniforms.uTime.value = elapsed;
    particles.rotation.y = elapsed * 0.04;
    particles.rotation.x = elapsed * 0.02;
  }

  return { particles, tick };
}
