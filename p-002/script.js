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
        far: 30.0,
        position: new THREE.Vector3(0.0, 5.0, 20.0),
        lookAt: new THREE.Vector3(0.0, 0.0, 0.0),
    }
    /**
     * レンダラー定義のための定数
     */
    static RENDERER_PARAM = {
        clearColor: 0x333333,
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
        color: 0xcccccc,
    }

    renderer; // レンダラー
    scene; // シーン
    camera; // カメラ
    directionalLight; // 平行光源
    ambientLight; // 環境光
    material; // マテリアル
    headGeometry; // 頭のジオメトリ
    bodyGeometry; // 胴体のジオメトリ
    neckGeometry; // 胴体のジオメトリ
    baseGeometry; // 胴体のジオメトリ
    wingGeometry; // 羽のジオメトリ
    wingArray; // 羽のメッシュの配列
    wingGroup; // 羽のグループ
    wholeGroup; // 全体のグループ
    upperNeckGroup; // 首上のグループ
    controls; // オービットコントロール
    axesHelper; // アクシスヘルパー
    isDown; // キーの押下監視用フラグ

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

        // 平行光源
        this.directionalLight = new THREE.DirectionalLight(
            ThreeApp.DIREECTIONAL_LIGHT_PARAM.color,
            ThreeApp.DIREECTIONAL_LIGHT_PARAM.intensity
        );
        this.directionalLight.position.copy(ThreeApp.DIREECTIONAL_LIGHT_PARAM.position);
        this.scene.add(this.directionalLight);

        // 環境光
        this.ambientLight = new THREE.AmbientLight(
            ThreeApp.AMBIENT_LIGHT_PARAM.color,
            ThreeApp.AMBIENT_LIGHT_PARAM.intensity
        );
        this.scene.add(this.ambientLight);

        // マテリアル
        this.material = new THREE.MeshPhongMaterial(ThreeApp.MATERIAL_PARAM)

        // グループ
        this.wingGroup = new THREE.Group();
        this.upperNeckGroup = new THREE.Group();
        this.wholeGroup = new THREE.Group();
        this.upperNeckGroup.add(this.wingGroup);
        this.wholeGroup.add(this.upperNeckGroup);
        this.scene.add(this.wholeGroup);

        // 首
        this.neckGeometry = new THREE.CylinderGeometry(0.5, 0.5, 10, 80);
        const neck = new THREE.Mesh(this.neckGeometry, this.material);
        neck.position.y = -5;
        this.wholeGroup.add(neck);

        // 土台
        this.baseGeometry = new THREE.CylinderGeometry(3.5, 3.5, 0.5, 80);
        const base = new THREE.Mesh(this.baseGeometry, this.material);
        base.position.y = -10;
        this.wholeGroup.add(base);

        // 胴体
        const bodyLength = 3;
        this.bodyGeometry = new THREE.CylinderGeometry(1.5, 1.5, bodyLength, 6);
        const body = new THREE.Mesh(this.bodyGeometry, this.material);
        body.rotation.y = Math.PI / 2; //90度回転
        body.rotation.x = Math.PI / 2; //90度回転
        this.upperNeckGroup.add(body);

        // 頭
        const headLength = 1;
        this.headGeometry = new THREE.CylinderGeometry(1, 1, headLength, 120);
        const head = new THREE.Mesh(this.headGeometry, this.material);
        head.rotation.x = Math.PI / 2;
        head.position.z = (bodyLength / 2) + headLength / 2;
        this.wingGroup.add(head);


        // 羽
        const wingCount = 8;
        const wingLength = 3.5;
        let wingRotateZ = 0;
        this.wingGeometry = new THREE.BoxGeometry(wingLength, 1, 0.1);
        this.wingArray = [];

        for (let i = 0; i < wingCount; ++i) {
            const wing = new THREE.Mesh(this.wingGeometry, this.material);
            const radian = i / wingCount * Math.PI * 2;
            wing.position.x = (wingLength * 0.6) * Math.cos(radian);
            wing.position.y = (wingLength * 0.6) * Math.sin(radian);
            wing.position.z = (bodyLength / 2) + headLength / 2;
            // wing.rotation.y = 0.2;
            wing.rotation.z = wingRotateZ;

            wingRotateZ += (Math.PI / wingCount * 2);

            this.wingGroup.add(wing);
            this.wingArray.push(wing);
        }

        // 軸ヘルパー
        const axesBarLength = 5.0;
        this.axesHelper = new THREE.AxesHelper(axesBarLength);
        this.scene.add(this.axesHelper);

        // コントロール
        this.controls = new OrbitControls(this.camera, this.renderer.domElement);

        // this のバインド
        this.render = this.render.bind(this);
        // キーの押下状態を保持するフラグ
        this.isDown = false;

        // キーの押下や離す操作を検出できるようにする
        window.addEventListener('keydown', (keyEvent) => {
            switch (keyEvent.key) {
                case ' ': // スペースキーの場合
                    this.isDown = true;
                    break;
                default:
            }
        }, false);
        window.addEventListener('keyup', (keyEvent) => {
            this.isDown = false;
        }, false);

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
        requestAnimationFrame(this.render); // FPS毎に自身を呼び出す 60FPSなら1秒間に60回

        // オービットコントロール
        this.controls.update();

        // 位置調整
        this.wholeGroup.position.y = 4;

        // アニメーション
        this.upperNeckGroup.rotation.y = (Math.PI / 2) * Math.sin(Date.now() * 0.001);
        this.wingGroup.rotation.z += 0.1;

        // レンダラーで描画
        this.renderer.render(this.scene, this.camera);
    }
}