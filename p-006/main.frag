precision mediump float;

varying vec3 vNormal;
varying vec4 vColor;

const vec3 light = vec3(1.0, 1.0, 1.0); // vec3(1.0, 1.0, 1.0);

void main() {

    vec3 n = normalize(vNormal);
    vec3 l = normalize(light); // ライトベクトルを単位化
    float d = dot(n, l);

    gl_FragColor = vec4(vColor.rgb * d, vColor.a);
}