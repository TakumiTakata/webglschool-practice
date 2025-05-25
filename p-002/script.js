import * as THREE from '../lib/three.module.js';
import {
    OrbitControls
} from '../lib/OrbitControls.js';

window.addEventListener('DOMContentLoaded', () => {
    const wrapper = document.querySelector('#webgl');
    const app = new ThreeApp(wrapper);
    app.render();
}, false)

class ThreeApp {
    /**
     * カメラ定義のための定数
     */
    static CAMERA_PARAM = {
        fovy: 60,
        aspect: window.innerWidth / window.innerHeight,
        near: 0.1,
        far: 20.0,
        position: new THREE.Vector3(0.0, 2.0, 10.0),
        lookAt: new THREE.Vector3(0.0, 0.0, 0.0),
    }
    /**
     * レンダラー定義のための定数
     */
    static RENDERER_PARAM = {
        clearColor: 0x666666,
        width: window.innerWidth,
        height: window.innerHeight,
    }
    /**
     * 平行光源定義のための定数
     */
    static DIREECTIONAL_LIGHT_PARAM = {
        color: 0xffffff,
        intensity: 1.0,
        position: new THREE.Vector3(1.0, 1.0, 1.0),
    }
    /**
     * 環境光定義のための定数
     */
    static AMBIENT_LIGHT_PARAM = {
        color: 0xffffff,
        intensity: 0.1,
    }
    /**
     * マテリアル定義のための定数
     */
    static MATERIAL_PARAM = {
        color: 0x999999,
    }

    renderer;           // レンダラー
    scene;              // シーン
    camera;             // カメラ
    directionalLight;   // 平行光源
    ambientLight;       // 環境光
    material;           // マテリアル
    cylinderGeometry;   // 円柱のジオメトリ
    wingGeometry;       // 羽のジオメトリ
    wingArray;          // 羽のメッシュの配列
    upperNeckGroup;     // 首上のグループ
    controls;           // オービットコントロール
    axesHelper;         // アクシスヘルパー
    isDown;             // キーの押下監視用フラグ

    /**
     * コンストラクタ
     * @constructor
     * @param {HTMLElemnt} wrapper - canvas要素をappendする親要素
     */
    constructor(wrapper) {

        // レンダラー
        const color = new THREE.Color(ThreeApp.RENDERER_PARAM.clearColor);
        this.renderer = new THREE.WebGLRenderer();
        this.renderer.setClearColor(color);
        this.renderer.setSize(ThreeApp.RENDERER_PARAM.width, ThreeApp.RENDERER_PARAM.height);
        wrapper.appendChild(this.renderer.domElement);

        // シーン
        this.scene = new THREE.Scene();

        // カメラ
        this.camera = new THREE.PerspectiveCamera(
            ThreeApp.CAMERA_PARAM.fovy,
            ThreeApp.CAMERA_PARAM.aspect,
            ThreeApp.CAMERA_PARAM.near,
            ThreeApp.CAMERA_PARAM.far,
        );
        this.camera.position.copy(ThreeApp.CAMERA_PARAM.position);
        this.camera.lookAt(ThreeApp.CAMERA_PARAM.lookAt);

        // this のバインド
        this.render = this.render.bind(this);

        // ウインドウのリサイズ検知
        window.addEventListener('resize', () => {
            this.renderer.setSize(window.innerWidth, window.innerHeight);
            this.camera.aspect = window.innerWidth / window.innerHeight;
            this.camera.updateProjectionMatrix();
        }, false);
    }


    /**
     * 描画処理
     */
    render() {
        // 恒常ループ
        requestAnimationFrame(this.render);

        // this.controls.update();

        this.renderer.render(this.scene, this.camera);
    }
}