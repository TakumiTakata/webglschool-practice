import * as THREE from '../lib/three.module.js';
import {
    OrbitControls
} from '../lib/OrbitControls.js';

window.addEventListener('DOMContentLoaded', async () => {
    const wrapper = document.querySelector('#webgl');
    const app = new ThreeApp(wrapper);
    await app.load();
    app.init();
    app.render();
}, false)

class ThreeApp {
    /**
     * 人工衛星の距離
     */
    static PLANE_DISTANCE = 3.5;
    /**
     * 人工衛星の回転周期（秒）
     */
    static PLANE_ROTATION_PERIOD = 8.0;
    /**
     * 👀の距離
     */
    static EYES_DISTANCE = 3.2;

    /**
     * カメラ定義のための定数
     */
    static CAMERA_PARAM = {
        fovy: 60,
        aspect: window.innerWidth / window.innerHeight,
        near: 0.1,
        far: 30.0,
        position: new THREE.Vector3(0.0, 2.0, 10.0),
        lookAt: new THREE.Vector3(0.0, 0.0, 0.0),
    }
    /**
     * レンダラー定義のための定数
     */
    static RENDERER_PARAM = {
        clearColor: 0x111111,
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
        intensity: 0.3,
    }
    /**
     * マテリアル定義のための定数
     */
    static MATERIAL_PARAM = {
        planeColor: 0xeeeeee,
        eyeColor: 0xffffff,
    }
    /**
     * フォグ定時のための定数
     */
    static FOG_PARAM = {
        color: 0xffffff,
        near: 10.0,
        far: 20.0,
    };

    wrapper; // canvasの親要素
    renderer; // レンダラー
    scene; // シーン
    camera; // カメラ
    directionalLight; // 平行光源
    ambientLight; // 環境光
    controls; // オービットコントロール
    axesHelper; // アクシスヘルパー
    isDown; // キーの押下監視用フラグ
    clock; // 時間管理用
    earth; // 地球
    earthGeometry; // 地球用ジオメトリ
    earthMaterial; // 地球用マテリアル
    earthTexture; // 地球用テクスチャ
    palne; // 飛行機
    palneGeometry; // 飛行機用ジオメトリ
    palneMaterial; // 飛行機用マテリアル
    eyeGeometryHalfCircle; // 片目用ジオメトリ
    eyeGeometryPanel; // 片目用ジオメトリ
    eyeMaterial; // 片目用マテリアル
    eyesArray;
    eyesGroup; // 両目グループ



    /**
     * コンストラクタ
     * @constructor
     * @param {HTMLElemnt} wrapper - canvas要素をappendする親要素
     */
    constructor(wrapper) {

        // 初期化時にcanvasをappendできるようにプロパティを維持
        this.wrapper = wrapper;

        //再起呼び出しのためのthis固定
        this.render = this.render.bind(this);

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
     * アセットのロードを行うPromise
     */
    load() {
        return new Promise((resolve, reject) => {
            const earthPath = './earth.jpg';
            const loader = new THREE.TextureLoader();
            loader.load(earthPath, (earthTexture) => {
                // 地球用
                this.earthTexture = earthTexture;
                resolve();
            });
        })
    }

    /**
     * 初期化処理
     */
    init() {
        // レンダラー
        const color = new THREE.Color(ThreeApp.RENDERER_PARAM.clearColor);
        this.renderer = new THREE.WebGLRenderer();
        this.renderer.setClearColor(color);
        this.renderer.setSize(ThreeApp.RENDERER_PARAM.width, ThreeApp.RENDERER_PARAM.height);
        this.wrapper.appendChild(this.renderer.domElement);

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


        // 地球のメッシュ作成
        this.earthGeometry = new THREE.SphereGeometry(3, 32, 32);
        this.earthMaterial = new THREE.MeshPhongMaterial(ThreeApp.MATERIAL_PARAM.planeColor);
        this.earthMaterial.map = this.earthTexture;
        this.earth = new THREE.Mesh(this.earthGeometry, this.earthMaterial);
        this.scene.add(this.earth);

        // 飛行機のメッシュ作成
        // this.planeGeometry = new THREE.ConeGeometry(0.2, 0.4, 32);
        const planeRadius = 0.2;
        this.planeGeometry = new THREE.SphereGeometry(planeRadius, 32, 32);
        this.planeMaterial = new THREE.MeshPhongMaterial(ThreeApp.MATERIAL_PARAM.planeColor);
        this.plane = new THREE.Mesh(this.planeGeometry, this.planeMaterial);
        this.plane.position.y = ThreeApp.PLANE_DISTANCE - planeRadius;
        this.scene.add(this.plane);

        // 👀のメッシュ作成準備
        this.eyeGeometryHalfCircle = new THREE.CircleGeometry(0.1, 32, 0, Math.PI);
        this.eyeGeometryPanel = new THREE.PlaneGeometry(0.2, 0.3);
        this.eyeMaterial = new THREE.MeshBasicMaterial(ThreeApp.MATERIAL_PARAM.eyeColor);

        this.eyesGroup = new THREE.Group();
        this.eyesArray = [];

        // 👀のメッシュ作成
        for (let i = 0; i < 2; ++i) {
            const eye = new THREE.Group();
            const eyeHalfCircleTop = new THREE.Mesh(this.eyeGeometryHalfCircle, this.eyeMaterial);
            const eyeHalfCircleBottom = new THREE.Mesh(this.eyeGeometryHalfCircle, this.eyeMaterial);
            const eyePanel = new THREE.Mesh(this.eyeGeometryPanel, this.eyeMaterial);

            eyeHalfCircleTop.position.y = 0.15;
            eyeHalfCircleBottom.position.y = -0.15;
            eyeHalfCircleBottom.rotation.z = Math.PI;

            eye.add(eyeHalfCircleTop)
            eye.add(eyeHalfCircleBottom)
            eye.add(eyePanel)

            if (i === 0) {
                eye.position.x = 0.2;
            } else {
                eye.position.x = -0.2;
            }

            this.eyesGroup.add(eye);
            this.eyesArray.push(eye);
        }

        // this.eyesGroup.position.z = 3.1;
        this.scene.add(this.eyesGroup);

        window.addEventListener('pointermove', (pointerEvent) => {
            const pointerX = pointerEvent.clientX;
            const pointerY = pointerEvent.clientY;

            // 画面中央を起点にした -1.0 ~ 1.0 に変換
            const scaleX = pointerX / window.innerWidth * 2.0 - 1.0;
            const scaleY = pointerY / window.innerHeight * 2.0 - 1.0;

            let positionZ = 1;

            // 画面端に近いほどpositionZを0に近づける
            const distanceFromCenter = Math.sqrt(scaleX * scaleX + scaleY * scaleY);
            positionZ = Math.max(0, 1 - distanceFromCenter);

            // ベクトルの定義
            const vector = new THREE.Vector3(
                scaleX,
                scaleY,
                positionZ
            )
            // ベクトルの単位化
            vector.normalize();

            this.eyesGroup.position.set(
                // scaleX * ThreeApp.EYES_DISTANCE,
                // scaleY * ThreeApp.EYES_DISTANCE * -1,
                vector.x * ThreeApp.EYES_DISTANCE,
                vector.y * ThreeApp.EYES_DISTANCE * -1,
                vector.z * ThreeApp.EYES_DISTANCE,
            )
        }, false);




        // clockオブジェクトを生成
        this.clock = new THREE.Clock();


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
    }




    /**
     * 描画処理
     */
    render() {
        // 恒常ループ
        requestAnimationFrame(this.render); // FPS毎に自身を呼び出す

        // オービットコントロール
        this.controls.update();

        const time = this.clock.getElapsedTime();
        // 回転周期を考慮した時間計算（2π / 周期秒 で角速度を調整）
        const rotateSpeed = time * (2 * Math.PI / ThreeApp.PLANE_ROTATION_PERIOD);

        this.plane.position.set(
            Math.cos(rotateSpeed) * ThreeApp.PLANE_DISTANCE,
            Math.sin(rotateSpeed) * ThreeApp.PLANE_DISTANCE,
            0.0
        );


        // レンダラーで描画
        this.renderer.render(this.scene, this.camera);
    }
}