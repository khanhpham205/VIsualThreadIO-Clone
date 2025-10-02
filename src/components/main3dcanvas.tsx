'use client';

import { useEffect, useRef } from 'react';
import {
    Engine,
    Scene,
    ArcRotateCamera,
    HemisphericLight,
    Vector3,
    MeshBuilder,
    Color3,
    Vector2,
} from '@babylonjs/core';

interface BabylonCanvasProps {
    onSceneReady?: (scene: Scene) => void; // callback gửi scene lên cha
}

export default function BabylonCanvas({ onSceneReady }: BabylonCanvasProps) {
    const canvasRef = useRef<HTMLCanvasElement | null>(null);
    const engineRef = useRef<Engine | null>(null);
    const sceneRef = useRef<Scene | null>(null);

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;

        const engine = new Engine(canvas, true);
        engineRef.current = engine;

        const scene = new Scene(engine);
        sceneRef.current = scene;

        scene.clearColor = Color3.FromHexString('#49475B').toColor4();

        const ground = MeshBuilder.CreateGround(
            'ground',
            { width: 3, height: 3 },
            scene,
        );

        const camera = new ArcRotateCamera(
            'cam',
            Math.PI / 4,
            Math.PI / 2,
            10,
            new Vector3(0, 0, 0),
            scene,
        );
        camera.lowerRadiusLimit = 1.5;
        camera.upperRadiusLimit = 2.7;

        camera.angularSensibilityX = 7000;
        camera.angularSensibilityY = 7000;

        camera.wheelPrecision = 300;
        camera.panningSensibility = 0;

        camera.targetScreenOffset.addInPlace(new Vector2(0, -0.85));
        camera.attachControl(canvas, true);

        const light = new HemisphericLight(
            'light',
            new Vector3(0, 1, 0),
            scene,
        );
        // light.intensity = 0.7;
        engine.runRenderLoop(() => scene.render());

        // Truyền scene về cha khi sẵn sàng
        if (onSceneReady) onSceneReady(scene);

        window.addEventListener('resize', () => engine.resize());

        return () => {
            engine.dispose();
        };
    }, [onSceneReady]);

    return <canvas ref={canvasRef} className="w-full h-full" />;
}
