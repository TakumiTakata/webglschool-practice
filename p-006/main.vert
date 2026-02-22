attribute vec3 position;
attribute vec3 normal;
attribute vec4 color;
uniform mat4 mvpMatrix;
uniform mat4 normalMatrix;
varying vec3 vNormal;
varying vec4 vColor;

//  ライトベクトル（固定）
// 🚚 const vec3 light = vec3(1.0, 1.0, 1.0);

void main() {
    vec3 n = (normalMatrix * vec4(normal, 0.0)).xyz; // 法線を行列に変換
    vNormal = n;
    // vec3 nn = normalize(n); // 法線を単位化
    // 🚚 vec3 l = normalize(light);
    // float d = dot(nn, l); // ふたつの内積をとる

    // vColor = vec4(color.rgb * d, color.a);
    vColor = color;

    gl_Position = mvpMatrix * vec4(position, 1.0);
}
