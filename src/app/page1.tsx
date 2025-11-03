'use client';

import { useEffect, useRef } from 'react';
import * as THREE from 'three';
import { GLTFLoader } from 'three-stdlib';
import { OrbitControls } from 'three-stdlib';

export default function ModelViewer() {
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
        renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.25));
        renderer.setClearColor(0x49475b, 1);
        renderer.shadowMap.enabled = false;
        renderer.toneMapping = THREE.NoToneMapping;

        const scene = new THREE.Scene();
        const camera = new THREE.PerspectiveCamera(
            45,
            window.innerWidth / window.innerHeight,
            0.01,
            100,
        );
        camera.position.set(0, 1.6, 2);

        const hemiLight = new THREE.HemisphereLight(0xffffff, 0x444444, 1.2);
        hemiLight.position.set(0, 20, 0);
        scene.add(hemiLight);

        const dirLight = new THREE.DirectionalLight(0xffffff, 1);
        dirLight.position.set(3, 10, 10);
        scene.add(dirLight);

        const controls = new OrbitControls(camera, renderer.domElement);
        controls.enableDamping = false;
        controls.enableZoom = true;
        controls.enablePan = true;
        controls.addEventListener('change', renderScene);

        const loader = new GLTFLoader();
        loader.load('/models/a/c.glb', (gltf) => {
            const model = gltf.scene;
            model.traverse((obj) => {
                if ((obj as THREE.Mesh).isMesh) {
                    const mesh = obj as THREE.Mesh;
                    const mat = mesh.material as THREE.MeshStandardMaterial;
                    if (mat) {
                        mat.side = THREE.DoubleSide;
                        mat.envMapIntensity = 0;
                        mat.roughness = Math.min(mat.roughness ?? 1, 0.9);
                        mat.metalness = 0;
                        mat.needsUpdate = true;
                    }
                }
            });
            model.position.set(0, 0, 0);
            scene.add(model);
            controls.target.copy(model.position);
            renderScene();
        });

        function renderScene() {
            renderer.render(scene, camera);
        }

        window.addEventListener('resize', () => {
            camera.aspect = window.innerWidth / window.innerHeight;
            camera.updateProjectionMatrix();
            renderer.setSize(window.innerWidth, window.innerHeight);
            renderScene();
        });

        return () => {
            renderer.dispose();
            controls.dispose();
        };
    }, []);

    return <canvas ref={canvasRef} className="w-full h-full fixed inset-0" />;
}
