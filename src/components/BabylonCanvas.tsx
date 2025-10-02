'use client';
import { useEffect, useRef } from 'react';
import {
    Engine,
    Scene,
    ArcRotateCamera,
    HemisphericLight,
    Vector3,
    SceneLoader,
    StandardMaterial,
    DynamicTexture,
    Color3,
    AbstractMesh,
    PickingInfo,
    AxesViewer,
    Mesh,
} from '@babylonjs/core';
import '@babylonjs/loaders/glTF';

export default function BabylonCanvas() {
    const canvasRef = useRef<HTMLCanvasElement | null>(null);

    useEffect(() => {
        if (!canvasRef.current) return;

        const engine = new Engine(canvasRef.current, true);
        const scene = new Scene(engine);
        // hiển thị trục trung tâm
        new AxesViewer(scene, 1);

        // Camera xoay quanh
        const camera = new ArcRotateCamera(
            'camera',
            Math.PI / 2,
            Math.PI / 2.5,
            2.5,
            Vector3.Zero(),
            scene,
        );
        camera.attachControl(canvasRef.current, true);

        // Ánh sáng cơ bản
        new HemisphericLight('light', new Vector3(0, 1, 0), scene);

        // Biến giữ material động
        let dynTex: DynamicTexture | null = null;
        let shirtMesh: AbstractMesh | null = null;

        // Load áo từ GLTF
        SceneLoader.Append(
            '/models/Men_s Hoddie-Stay Wild_gltf_thick/',
            "Men's Hoddie-Stay Wild_gltf_thick.gltf",
            scene,
            () => {
                shirtMesh =
                    scene.meshes.find((m) => m.name.includes('shirt')) || null;

                if (shirtMesh) {
                    const mat = new StandardMaterial('shirtMat', scene);
                    dynTex = new DynamicTexture(
                        'shirtTex',
                        { width: 2048, height: 2048 },
                        scene,
                    );
                    mat.diffuseTexture = dynTex;
                    mat.emissiveColor = Color3.White();
                    shirtMesh.material = mat;

                    // Nền trắng ban đầu
                    dynTex.drawText(
                        '',
                        0,
                        0,
                        '100px Arial',
                        'black',
                        'white',
                        true,
                    );
                }
            },
        );

        // Xử lý click để dán logo
        scene.onPointerObservable.add((pointerInfo) => {
            if (!dynTex || !shirtMesh) return;

            if (pointerInfo.pickInfo && pointerInfo.pickInfo.hit) {
                const pick: PickingInfo = pointerInfo.pickInfo;
                if (pick.getTextureCoordinates()) {
                    const uv = pick.getTextureCoordinates()!;
                    const x = uv.x * dynTex.getSize().width;
                    const y = (1 - uv.y) * dynTex.getSize().height;

                    // Vẽ chữ "LOGO" vào vị trí click
                    dynTex.drawText(
                        'LOGO',
                        x - 50,
                        y,
                        'bold 80px Arial',
                        'red',
                        null,
                        true,
                    );
                }
            }
        });

        // Render loop
        engine.runRenderLoop(() => scene.render());
        window.addEventListener('resize', () => engine.resize());

        return () => {
            engine.dispose();
        };
    }, []);

    return <canvas ref={canvasRef} className="w-full h-screen" />;
}
