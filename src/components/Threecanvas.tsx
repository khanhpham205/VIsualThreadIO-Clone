'use client';

import { useEffect, useRef } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three-stdlib';

export default function ThreeCanvas({
    onSceneReady,
}: {
    onSceneReady?: (scene: THREE.Scene) => void;
}) {
    const canvasRef = useRef<HTMLCanvasElement>(null);

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;

        const renderer = new THREE.WebGLRenderer({
            canvas,
            antialias: true,
            alpha: true,
        });
        renderer.setSize(window.innerWidth, window.innerHeight);
        renderer.setClearColor(0x49475b, 1);

        const scene = new THREE.Scene();

        const camera = new THREE.PerspectiveCamera(
            45,
            window.innerWidth / window.innerHeight,
            0.01,
            100,
        );
        camera.position.set(1.5, 1.8, 2.5);

        const controls = new OrbitControls(camera, renderer.domElement);
        controls.enableDamping = true;
        controls.dampingFactor = 0.05;
        controls.minDistance = 1.2;
        controls.maxDistance = 3.0;
        controls.target.set(0, 1, 0);
        controls.update();

        const light = new THREE.HemisphereLight(0xffffff, 0x444444, 1);
        light.position.set(0, 1, 0);
        scene.add(light);

        const dirLight = new THREE.DirectionalLight(0xffffff, 1);
        dirLight.position.set(5, 10, 7.5);
        scene.add(dirLight);

        function animate() {
            controls.update();
            renderer.render(scene, camera);
            requestAnimationFrame(animate);
        }
        animate();

        if (onSceneReady) onSceneReady(scene);

        window.addEventListener('resize', () => {
            camera.aspect = window.innerWidth / window.innerHeight;
            camera.updateProjectionMatrix();
            renderer.setSize(window.innerWidth, window.innerHeight);
        });

        return () => {
            renderer.dispose();
            controls.dispose();
        };
    }, [onSceneReady]);

    return <canvas ref={canvasRef} className="w-full h-full" />;
}
