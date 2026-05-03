attribute vec3 position;
attribute vec3 normal;
attribute vec4 color;
attribute vec2 texCoord;

uniform mat4 mvpMatrix;
uniform mat4 normalMatrix;
uniform float uTime;

varying vec4 vColor;
varying vec2 vTexCoord;
varying float vTime;

// ライトベクトルはひとまず定数で定義する
const vec3 light = vec3(1.0, 1.0, 1.0);

void main() {
    vec3 n = (normalMatrix * vec4(normal, 0.0)).xyz; // 法線を行列に変換

    // 変換した法線と、ライトベクトルで内積をとる
    float d = dot(normalize(n), normalize(light));

    // diffuseを0.0より大きくなる範囲を広げる（裏面も見えてほしい）
    d = d * 0.5 + 0.5;

    // 内積の結果を頂点カラーのRGB成分に乗算する
    vColor = vec4(color.rgb * d, color.a);

    // テクスチャ座標をフラグメントシェーダーに送る
    vTexCoord = texCoord;

    // 経過時間をそのままフラグメントシェーダーに送る
    vTime = uTime;

    gl_Position = mvpMatrix * vec4(position, 1.0);
}
