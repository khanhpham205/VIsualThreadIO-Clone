'use client';
import { useEffect, useRef } from 'react';
import {
    Engine,
    Scene,
    ArcRotateCamera,
    HemisphericLight,
    Vector3,
    Vector2,
    SceneLoader,
    Color3,
    AxesViewer,
    AbstractMesh,
    StandardMaterial,
    DynamicTexture,
    Texture,
    MeshBuilder,
    FreeCamera,
} from '@babylonjs/core';
import '@babylonjs/loaders/glTF';

export default function Stage() {
    const modelPath = '/models/blender_teeMaleAnimated.glb';

    const canvasRef = useRef<HTMLCanvasElement | null>(null);
    const sceneRef = useRef<Scene | null>(null);
    const engineRef = useRef<Engine | null>(null);
    const shirtMeshRef = useRef<AbstractMesh | null>(null);

    const loadModel = ({ path }: { path: string }) => {
        SceneLoader.Append(
            path.replace(/\/[^/]+$/, '/'),
            path.split('/').pop()!,
            sceneRef.current,
            () => {
                const root = sceneRef.current!.meshes[0];
                console.log('Model loaded:', root);
            },
        );
    };

    useEffect(() => {
        if (!canvasRef.current) return;

        const engine = new Engine(canvasRef.current, true);
        const scene = new Scene(engine);
        sceneRef.current = scene;
        engineRef.current = engine;

        // background
        scene.clearColor = Color3.FromHexString('#B694EB').toColor4();
        // new AxesViewer(scene, 1);

        const ground = MeshBuilder.CreateGround(
            'ground',
            { width: 3, height: 3, subdivisions: 64 },
            scene,
        );

        const groundMat = new StandardMaterial('groundMat', scene);
        groundMat.diffuseColor = Color3.FromHexString('#59AC77'); // xám nhạt
        groundMat.specularColor = new Color3(0, 0, 0); // không bóng

        ground.material = groundMat;

        const camera = new ArcRotateCamera(
            'camera',
            Math.PI / 4, // alpha
            Math.PI / 4, // beta
            10, // radius
            new Vector3(0, 0, 0), // target ban đầu
            scene,
        );
        camera.attachControl(canvasRef.current, true);
        // camera.panningSensibility = 1000;
        // camera.panningAxis = new Vector3(1, 10, 0);
        camera.lowerRadiusLimit = 1.5;
        camera.upperRadiusLimit = 3;

        camera.angularSensibilityX = 7000;
        camera.angularSensibilityY = 7000;

        camera.wheelPrecision = 300;

        // camera.targetScreenOffset.addInPlace(new Vector2(0, -0.85));

        const targetMarker = MeshBuilder.CreateSphere(
            'targetMarker',
            { diameter: 0.1 },
            scene,
        );
        targetMarker.position = camera.target.clone();

        // tô màu đỏ cho dễ thấy
        const markerMat = new StandardMaterial('markerMat', scene);
        markerMat.diffuseColor = new Color3(1, 0, 0);
        targetMarker.material = markerMat;

        // update theo camera.target mỗi frame
        scene.onBeforeRenderObservable.add(() => {
            targetMarker.position.copyFrom(camera.target);
        });
        // light
        new HemisphericLight('light', new Vector3(0, 1, 0), scene);

        // load model
        SceneLoader.Append(
            modelPath.replace(/\/[^/]+$/, '/'),
            modelPath.split('/').pop()!,
            scene,
            () => {
                const root = scene.meshes[0];
                console.log('Model loaded:', root);
                if (root) {
                    const bounding = root.getBoundingInfo().boundingBox;
                    // const height = bounding.maximumWorld.y - bounding.minimumWorld.y;

                    camera.setTarget(bounding.centerWorld);
                    // root.position.y -= height * 0.5;
                    shirtMeshRef.current = root; // giữ ref để apply logo
                }
            },
        );

        engine.runRenderLoop(() => scene.render());
        window.addEventListener('resize', () => engine.resize());

        return () => {
            engine.dispose();
        };
    }, [modelPath]);

    // handler khi chọn ảnh
    const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (!e.target.files?.[0] || !sceneRef.current) return;
        const file = e.target.files[0];
        const url = URL.createObjectURL(file);

        // tạo material mới
        const mat = new StandardMaterial('shirtMat', sceneRef.current);
        const tex = new Texture(
            url,
            sceneRef.current,
            true,
            false,
            Texture.TRILINEAR_SAMPLINGMODE,
        );
        mat.diffuseTexture = tex;
        mat.specularColor = new Color3(0, 0, 0);

        if (shirtMeshRef.current) {
            shirtMeshRef.current.material = mat;
        }
    };

    return (
        <div className="w-full h-full flex">
            <div className="w-200 bg-gray-500">
                <button>123</button>
                <input
                    type="file"
                    accept="image/*"
                    onChange={handleImageUpload}
                    className="p-2"
                />
            </div>
            <canvas ref={canvasRef} className="w-full h-full" />
        </div>
    );
}
