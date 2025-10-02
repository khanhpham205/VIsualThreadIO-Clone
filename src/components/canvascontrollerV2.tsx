'use client';

import React, { useRef, useEffect, useState } from 'react';
import {
    ArrowDownFromLine,
    ArrowUpFromLine,
    ImagePlus,
    Trash2,
} from 'lucide-react';
import { Scene } from '@babylonjs/core/scene';

interface PROP {
    loadmodel: (url: string) => void;
    clearModel: () => void;
}

export default function CanvasResize() {
    const canvasRef = useRef<HTMLCanvasElement | null>(null);
    const hitboxRef = useRef<HTMLDivElement | null>(null);

    const [objects, setObjects] = useState<ImgObj[]>([]);
    const [selectedId, setSelectedId] = useState<string | null>(null);
    const [activeHandle, setActiveHandle] = useState<Handle>(null);
    const [dragOffset, setDragOffset] = useState<{
        x: number;
        y: number;
    } | null>(null);

    // --- redraw ---
    useEffect(() => {
        const cv = canvasRef.current;
        if (!cv) return;
        const ctx = cv.getContext('2d');
        if (!ctx) return;

        const dpr = window.devicePixelRatio || 1;
        const rect = cv.getBoundingClientRect();
        cv.width = rect.width * dpr;
        cv.height = rect.height * dpr;
        ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

        ctx.fillStyle = '#1e1e1e';
        ctx.fillRect(0, 0, rect.width, rect.height);

        for (const obj of objects) {
            ctx.save();
            ctx.translate(obj.x, obj.y);
            ctx.scale(obj.w < 0 ? -1 : 1, obj.h < 0 ? -1 : 1);
            ctx.drawImage(obj.imageObj, 0, 0, Math.abs(obj.w), Math.abs(obj.h));
            ctx.restore();

            if (obj.id === selectedId) {
                const minX = Math.min(obj.x, obj.x + obj.w);
                const maxX = Math.max(obj.x, obj.x + obj.w);
                const minY = Math.min(obj.y, obj.y + obj.h);
                const maxY = Math.max(obj.y, obj.y + obj.h);

                ctx.save();
                ctx.strokeStyle = '#2b6df6';
                ctx.setLineDash([6, 4]);
                ctx.strokeRect(minX, minY, maxX - minX, maxY - minY);
                ctx.restore();
                drawHandles(ctx, obj);
            }
        }

        const handle = hitboxRef.current;

        const obj = objects.find((o) => o.id === selectedId);
        if (!selectedId || !handle || !obj) {
            handle!.style.opacity = '0';
            return;
        }

        handle.style.opacity = '1';
        handle.style.position = 'absolute';
        handle.style.top = `${obj.y}px`;
        handle.style.left = `${obj.x + obj.w}px`;
    }, [objects, selectedId]);

    function drawHandles(ctx: CanvasRenderingContext2D, obj: ImgObj) {
        const size = 8;
        const minX = Math.min(obj.x, obj.x + obj.w);
        const maxX = Math.max(obj.x, obj.x + obj.w);
        const minY = Math.min(obj.y, obj.y + obj.h);
        const maxY = Math.max(obj.y, obj.y + obj.h);

        const points = [
            { x: minX, y: minY, handle: 'tl' },
            { x: (minX + maxX) / 2, y: minY, handle: 't' },
            { x: maxX, y: minY, handle: 'tr' },
            { x: minX, y: (minY + maxY) / 2, handle: 'l' },
            { x: maxX, y: (minY + maxY) / 2, handle: 'r' },
            { x: minX, y: maxY, handle: 'bl' },
            { x: (minX + maxX) / 2, y: maxY, handle: 'b' },
            { x: maxX, y: maxY, handle: 'br' },
        ];
        ctx.fillStyle = '#2b6df6';
        points.forEach((p) => {
            ctx.fillRect(p.x - size / 2, p.y - size / 2, size, size);
        });
    }

    function getMousePos(e: React.PointerEvent<HTMLCanvasElement>) {
        const rect = canvasRef.current!.getBoundingClientRect();
        return { x: e.clientX - rect.left, y: e.clientY - rect.top };
    }

    function getHandleAtPoint(
        obj: ImgObj,
        p: { x: number; y: number },
    ): Handle {
        const size = 8;
        const minX = Math.min(obj.x, obj.x + obj.w);
        const maxX = Math.max(obj.x, obj.x + obj.w);
        const minY = Math.min(obj.y, obj.y + obj.h);
        const maxY = Math.max(obj.y, obj.y + obj.h);

        const handles = [
            { x: minX, y: minY, handle: 'tl' },
            { x: (minX + maxX) / 2, y: minY, handle: 't' },
            { x: maxX, y: minY, handle: 'tr' },
            { x: minX, y: (minY + maxY) / 2, handle: 'l' },
            { x: maxX, y: (minY + maxY) / 2, handle: 'r' },
            { x: minX, y: maxY, handle: 'bl' },
            { x: (minX + maxX) / 2, y: maxY, handle: 'b' },
            { x: maxX, y: maxY, handle: 'br' },
        ];
        for (const h of handles) {
            if (
                p.x >= h.x - size / 2 &&
                p.x <= h.x + size / 2 &&
                p.y >= h.y - size / 2 &&
                p.y <= h.y + size / 2
            ) {
                return h.handle as Handle;
            }
        }
        if (p.x >= minX && p.x <= maxX && p.y >= minY && p.y <= maxY)
            return 'move';
        return null;
    }

    function onPointerDown(e: React.PointerEvent<HTMLCanvasElement>) {
        const p = getMousePos(e);
        let hit = false;
        for (let i = objects.length - 1; i >= 0; i--) {
            const o = objects[i];
            const handle = getHandleAtPoint(o, p);
            if (handle) {
                setSelectedId(o.id);
                setActiveHandle(handle);
                if (handle === 'move')
                    setDragOffset({ x: p.x - o.x, y: p.y - o.y });
                hit = true;
                break;
            }
        }
        if (!hit) {
            setSelectedId(null);
            setActiveHandle(null);
        }
    }

    function onPointerMove(e: React.PointerEvent<HTMLCanvasElement>) {
        const p = getMousePos(e);
        if (activeHandle && e.buttons === 1 && selectedId) {
            setObjects((prev) =>
                prev.map((o) => {
                    if (o.id !== selectedId) return o;
                    let { x, y, w, h } = o;
                    switch (activeHandle) {
                        case 'move':
                            if (dragOffset) {
                                x = p.x - dragOffset.x;
                                y = p.y - dragOffset.y;
                            }
                            break;
                        case 'tl':
                            w = w + (x - p.x);
                            h = h + (y - p.y);
                            x = p.x;
                            y = p.y;
                            break;
                        case 'tr':
                            w = p.x - x;
                            h = h + (y - p.y);
                            y = p.y;
                            break;
                        case 'bl':
                            w = w + (x - p.x);
                            x = p.x;
                            h = p.y - y;
                            break;
                        case 'br':
                            w = p.x - x;
                            h = p.y - y;
                            break;
                        case 'l':
                            w = w + (x - p.x);
                            x = p.x;
                            break;
                        case 'r':
                            w = p.x - x;
                            break;
                        case 't':
                            h = h + (y - p.y);
                            y = p.y;
                            break;
                        case 'b':
                            h = p.y - y;
                            break;
                    }
                    return { ...o, x, y, w, h };
                }),
            );
        } else {
            // đổi cursor
            const obj = objects.find((o) => o.id === selectedId);
            if (!obj) return;
            let cursor = 'default';
            const handle = getHandleAtPoint(obj, p);
            switch (handle) {
                case 'tl':
                case 'br':
                    cursor = 'nwse-resize';
                    break;
                case 'tr':
                case 'bl':
                    cursor = 'nesw-resize';
                    break;
                case 'l':
                case 'r':
                    cursor = 'ew-resize';
                    break;
                case 't':
                case 'b':
                    cursor = 'ns-resize';
                    break;
                case 'move':
                    cursor = 'move';
                    break;
            }
            (e.target as HTMLCanvasElement).style.cursor = cursor;
        }
    }

    function onPointerUp() {
        setActiveHandle(null);
        setDragOffset(null);
    }

    function handleImageUpload(e: React.ChangeEvent<HTMLInputElement>) {
        const file = e.target.files?.[0];
        if (!file) return;
        const id = Date.now().toString();
        const url = URL.createObjectURL(file);
        const img = new Image();
        img.onload = () => {
            const ratio = img.width / img.height;
            const w = Math.min(300, img.width);
            const h = w / ratio;
            const newObj: ImgObj = {
                id,
                x: 60,
                y: 60,
                w,
                h,
                src: url,
                imageObj: img,
            };
            setObjects((prev) => [...prev, newObj]);
            setSelectedId(id);
            URL.revokeObjectURL(url);
            e.target.value = '';
        };
        img.src = url;
    }

    const handleDeleteSelected = () => {
        if (!selectedId) return;
        setObjects((prev) => prev.filter((o) => o.id !== selectedId));
        setSelectedId(null);
    };
    const handleUpSelected = () => {
        if (!selectedId) return;
        setObjects((prev) => {
            const index = prev.findIndex((o) => o.id === selectedId);
            if (index === -1 || index === prev.length - 1) return prev;
            const newArr = [...prev];
            const [obj] = newArr.splice(index, 1);
            newArr.splice(index + 1, 0, obj);
            return newArr;
        });
    };
    const handleDownSelected = () => {
        if (!selectedId) return;
        setObjects((prev) => {
            const index = prev.findIndex((o) => o.id === selectedId);
            if (index <= 0) return prev;
            const newArr = [...prev];
            const [obj] = newArr.splice(index, 1);
            newArr.splice(index - 1, 0, obj);
            return newArr;
        });
    };

    return (
        <div className="w-full h-screen p-4 flex flex-col gap-2 bg-neutral-900 text-white">
            <div className="flex h-15 gap-2 items-center">
                <label className="cursor-pointer rounded border border-slate-600 bg-slate-800 p-2">
                    <ImagePlus size={16} />
                    <input
                        type="file"
                        accept="image/*"
                        onChange={handleImageUpload}
                        className="hidden"
                    />
                </label>
                <button
                    className="px-2 py-1 rounded border border-slate-600 bg-slate-800 flex items-center gap-2"
                    onClick={() => {
                        setObjects([]);
                        setSelectedId(null);
                    }}
                    disabled={!objects.length}
                >
                    CLEAR
                </button>
            </div>

            <div className="relative">
                <canvas
                    ref={canvasRef}
                    className="w-full h-full touch-none border border-slate-700 rounded"
                    onPointerDown={onPointerDown}
                    onPointerMove={onPointerMove}
                    onPointerUp={onPointerUp}
                />
                <div
                    ref={hitboxRef}
                    className=" absolute bg-gray-800 top-0 left-0 handle p-2 ml-2 flex flex-col gap-2 rounded opacity-90"
                >
                    <Trash2
                        className="bg-blue-500 p-1 rounded disabled:opacity-50 "
                        onClick={handleDeleteSelected}
                    />
                    <ArrowUpFromLine
                        className="bg-blue-500 p-1 rounded disabled:opacity-50 "
                        onClick={handleUpSelected}
                    />
                    <ArrowDownFromLine
                        className="bg-blue-500 p-1 rounded disabled:opacity-50 "
                        onClick={handleDownSelected}
                    />
                </div>
            </div>
        </div>
    );
}
