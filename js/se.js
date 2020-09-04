
var THREE;
var camera, scene, renderer;
var geometry, material, mesh;

var points_y_max, points_x_max, points_z_max, points_y_min, points_x_min, points_z_min;

// Constants
var props = {
    stars: {
        columns: 10,
        rows: 10
    },
    color_cycles:{
        borealis: [0xFFFFFF, 0xF8EADC, 0xEFF1BB, 0xBFEA9C, 0x7EE385, 0x62DDAA, 0x47C7D6, 0x2E6ACF, 0x2F16C8, 0x8000C2, 0x2F16C8,0x2E6ACF, 0x47C7D6, 0x62DDAA, 0x7EE385, 0xBFEA9C, 0xEFF1BB, 0xF8EADC],
        purple: [0xFFFFFF, 0xFFFFFF , 0xFFFFFF, 0xF0E2F8, 0xE2C6F1, 0xD4AAEA, 0xC68DE3, 0xB871DD, 0xAA55D6, 0x9C38CF, 0x8E1CC8, 0x8000C2, 0x8000C2, 0x8000C2],
    }
}

//The fuller spectrum is slightly more fun, but it does feel less personal to my tastes, so we stick with purple
var color_cycle = props.color_cycles.purple;

var loop_height;
var star_size;

// Workaround CORS since ES6 doesn't play well with static local html files and I'm stubborn
import('https://unpkg.com/three/build/three.module.js')
.then((module) => {
    THREE = module;
    init();
    animate();
});

function onWindowResize() {

    windowHalfX = window.innerWidth / 2;
    windowHalfY = window.innerHeight / 2;

    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();

    renderer.setSize( window.innerWidth, window.innerHeight );

}

function init() {

    camera = new THREE.PerspectiveCamera( 70, window.innerWidth / window.innerHeight, 0.01, 30);
    camera.position.z = 1;

    scene = new THREE.Scene();

    star_size = 0.03 * window.devicePixelRatio;

    var vertices = [];
    var colors = [];
    var flipped_colors = [];
    var sizes = [];
    var scales = [];

    for( var i = (-1 * props.stars.columns); i < props.stars.columns; i++ ) {
        for( var j = (-1 * props.stars.rows); j < props.stars.rows; j++ ) {
            for( var k = 0; k < color_cycle.length; k++){
                vertices.push( i, k - (color_cycle.length / 2), j );
                var color = new THREE.Color(color_cycle[k]);
                colors.push(color.r, color.g, color.b, 1.0);
                var flipped_color = new THREE.Color(color_cycle[color_cycle.length - k - 1]);
                flipped_colors.push(flipped_color.r, flipped_color.g, flipped_color.b, 1.0);
                sizes.push(star_size);
                scales.push(star_size);
            }
        }
    }

    // To save on resources, the reversed color order is a separate geometry
    // Then we just swap A and B blocks infinitely back to the beginning

    var geometryA = new THREE.BufferGeometry();
    var geometryB = new THREE.BufferGeometry();
    geometryA.setAttribute( 'position', new THREE.Float32BufferAttribute( vertices, 3 ) );
    geometryA.setAttribute( 'scale', new THREE.Float32BufferAttribute( scales, 1 ) );
    geometryA.setAttribute( 'color', new THREE.Float32BufferAttribute( colors, 4 ) );
    geometryB.setAttribute( 'position', new THREE.Float32BufferAttribute( vertices, 3 ) );
    geometryB.setAttribute( 'scale', new THREE.Float32BufferAttribute( scales, 1 ) );
    geometryB.setAttribute( 'color', new THREE.Float32BufferAttribute( flipped_colors, 4 ) );

    var material = new THREE.ShaderMaterial( {
                    //vertexColors: true,
					uniforms: {
						pointTexture: { value: new THREE.TextureLoader().load( "img/star.png" ) }
					},
					vertexShader: document.getElementById( 'vertexshader' ).textContent,
					fragmentShader: document.getElementById( 'fragmentshader' ).textContent,

                    alphaTest: 0.9

                } );

    pointsA = new THREE.Points( geometryA, material );
    pointsB = new THREE.Points( geometryB, material );
    scene.add( pointsA );
    scene.add( pointsB );

    var bounding_box = new THREE.Box3();
    bounding_box.setFromObject( pointsA );
    points_y_max = bounding_box.max.y;
    points_y_min = bounding_box.min.y;
    pointsB.position.y -= (points_y_max - points_y_min);
    loop_height = points_y_max;

    // Need to modify custom ShaderMaterial before fog will work with it
    // scene.background = 0x000000;
    // scene.fog = new THREE.Fog(0x00ff00, 0.5, 100000);

    renderer = new THREE.WebGLRenderer( { antialias: false } );
    renderer.setPixelRatio( window.devicePixelRatio );
    renderer.setSize( window.innerWidth, window.innerHeight );
    //document.body.appendChild( renderer.domElement );
    document.getElementById('grand_and_miraculous').appendChild(renderer.domElement);
    window.addEventListener( 'resize', onWindowResize, false );

}

function animate() {

    requestAnimationFrame( animate );

    var time = Date.now() * 0.00005;
    pointsA.rotation.y = 1 * time;
    pointsA.position.y += 0.0000000001 * time;
    pointsB.rotation.y = 1 * time;
    pointsB.position.y += 0.0000000001 * time;

    if(pointsA.position.y > loop_height * 2){
        pointsA.position.y -= (points_y_max - points_y_min) * 2
    }
    if(pointsB.position.y > loop_height * 2){
        pointsB.position.y -= (points_y_max - points_y_min) * 2
    }
    
    render();
}

function render(){
    
    renderer.render( scene, camera );
}