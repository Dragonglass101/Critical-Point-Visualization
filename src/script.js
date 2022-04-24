// // importing required packages
import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";

var arr = [];
// horse seashell bunny cube sphere5 sphere20
function readTextFile() {
    var rawFile = new XMLHttpRequest();
    rawFile.open("GET", "seashell.gts", true);
    rawFile.onreadystatechange = function() {
        if (rawFile.readyState === 4) {
            var allText = rawFile.responseText;
            arr = allText.split("\n");
            fillArrays(arr);
        }
    };
    rawFile.send();
}
readTextFile();

var scene, camera, renderer;
var controls;
var obj;
const Scale = 30;

const vertices = [null];
const points = [];
const edges = [null];
const faces = [];

let num_vertices, num_edges, num_triangles;
let betti1, betti2, betti3;

var adj;
var heightFunctionList;
var LinkStruct;
// heightFunctionList[0] = null;

function fillArrays(arr) {
    [num_vertices, num_edges, num_triangles] = arr[0].split(" ");
    num_vertices = Number(num_vertices);
    num_edges = Number(num_edges);
    num_triangles = Number(num_triangles);

    heightFunctionList = new Array(num_vertices + 1).fill(null);
    adj = new Array(num_vertices + 1).fill(0).map(j => [])

    let i;

    function sphereHeightFunction(x, y) {
        return (Math.sqrt((1 * Scale) * (1 * Scale) - x * x - y * y));
    }
    for (i = 1; i <= num_vertices; i++) {
        let [x, y, z] = arr[i].split(" ");
        let X = Scale * Number(x);
        let Y = Scale * Number(y);
        let Z = Scale * (Number(z));

        vertices.push([X, Y, Z]);

        // if (Z >= 0)
        //     heightFunctionList[i] = sphereHeightFunction(X, Y);
        // if (Z < 0)
        //     heightFunctionList[i] = -sphereHeightFunction(X, Y);
        heightFunctionList[i] = Z;
        // heightFunctionList[i] = Math.random();
    }
    console.log(heightFunctionList);

    for (; i <= num_vertices + num_edges; i++) {

        let [e1, e2] = arr[i].split(" ");
        e1 = parseInt(e1);
        e2 = parseInt(e2);

        adj[e1].push(e2);
        adj[e2].push(e1);

        edges.push([e1, e2]);
    }
    console.log("adj: ", adj);


    for (; i <= num_vertices + num_edges + num_triangles; i++) {
        let [e1, e2, e3] = arr[i].split(" ");
        let repeteArr = [...edges[Number(e1)], ...edges[Number(e2)], ...edges[Number(e3)]];
        const set = new Set();
        for (let e of repeteArr)
            set.add(e);

        repeteArr.splice(0, repeteArr.length);
        repeteArr = Array.from(set);


        faces.push(repeteArr);
    }
    console.log(vertices, edges, faces);
    makePoints();
    makeLink();

    init();
    animate();
}

function makeLink() {
    LinkStruct = new Array(num_vertices + 1).fill(null).map(j => []);

    for (let i = 1; i <= num_vertices; i++) {
        let subTriangles = [];
        for (let f of faces) {
            if (f[0] == i || f[1] == i || f[2] == i) {
                let tempFace = f;
                let index = tempFace.indexOf(i);
                tempFace.splice(index, 1);
                tempFace.unshift(i);
                subTriangles.push(tempFace);
            }
        }

        let visitedTriangles = new Array(subTriangles.length).fill(false);
        let link = [];
        let tempSet = new Set();

        for (let s = 0; s < subTriangles.length; s++) {
            if (visitedTriangles[s]) continue;

            let currTriangle = subTriangles[s];
            if (i == 1) console.log(subTriangles[s][0], subTriangles[s][1], subTriangles[s][2]);
            let currVertex = subTriangles[s][1];
            tempSet.add(currVertex);
            if (i == 1) console.log(currVertex);
            currVertex = subTriangles[s][2];
            if (i == 1) console.log(currVertex);
            tempSet.add(currVertex);
            visitedTriangles[s] = true;

            for (let st = 0; st < subTriangles.length; st++) {
                if (visitedTriangles[st]) continue;

                if (subTriangles[st][1] == currVertex) {
                    currVertex = subTriangles[st][2];
                    tempSet.add(currVertex);
                    visitedTriangles[st] = true;
                    st = 0;
                    continue;
                }
                if (subTriangles[st][2] == currVertex) {
                    currVertex = subTriangles[st][1];
                    tempSet.add(currVertex);
                    visitedTriangles[st] = true;
                    st = 0;
                    continue;
                }
            }
        }
        link = Array.from(tempSet);
        LinkStruct[i] = link;
        if (i == 1) console.log(subTriangles, link);
    }
    console.log(LinkStruct);
}

function findMaximums(i) {}

function findSaddles(i) {

}

var criticalPoints = () => {
    let criticalPoints = [];
    for (let i = 1; i <= num_vertices; i++) {
        // findMaximums(i);
        // findSaddles(i);
        let heigthOfi = heightFunctionList[i];
        var mincount = 0;
        var maxcount = 0;
        for (let v of adj[i]) {
            if (heightFunctionList[v] > heigthOfi) {
                mincount++;

            } else if (heightFunctionList[v] < heigthOfi) {
                maxcount++;
            }
        }
        if (mincount == adj[i].length) {
            console.log(" MIN CRITICAL POINT");
            console.log(heigthOfi);
            for (let v of adj[i]) {
                console.log(heightFunctionList[v]);
            }
            criticalPoints.push(i);
        } else if (maxcount == adj[i].length) {
            console.log(" MAX CRITICAL POINT");
            console.log(heigthOfi);
            for (let v of adj[i]) {
                console.log(heightFunctionList[v]);
            }
            criticalPoints.push(i);
        }


    }
    return criticalPoints;
}

function findCricticalPoints() {
    let criticalPoints = [];
    for (let i = 1; i <= num_vertices; i++) {
        // findMaximums(i);
        // findSaddles(i);
        let heigthOfi = heightFunctionList[i];
        let i_link = LinkStruct[i];
        let currSign;
        let numberOfChangeOfSign = 0;

        if (heightFunctionList[i_link[0]] > 0)
            currSign = 1;
        if (heightFunctionList[i_link[0]] < 0)
            currSign = -1;

        // 1 represents positive and -1 represents negative
        for (let node of i_link) {
            if (heightFunctionList[node] > heigthOfi && currSign == -1) {
                currSign = 1;
                numberOfChangeOfSign++;
            }
            if (heightFunctionList[node] < heigthOfi && currSign == 1) {
                currSign = -1;
                numberOfChangeOfSign++;
            }
        }
        if (numberOfChangeOfSign === 0) {
            console.log("SUCCESSFULL", i);
            console.log(LinkStruct[i], heigthOfi);
            for (let node of i_link) {
                console.log(heightFunctionList[node]);
            }
            criticalPoints.push(i);
        }
    }
    return criticalPoints;
}


function makePoints() {
    points[0] = null;
    for (let i = 1; i <= num_vertices; i++) {
        points.push(new THREE.Vector3(vertices[i][0], vertices[i][1], vertices[i][2]));
    }
}


var triangulateKFacesWithShapes = (function() {
    var _ctr = new THREE.Vector3();
    var _plane = new THREE.Plane();
    var _q = new THREE.Quaternion();
    var _y = new THREE.Vector3();
    var _x = new THREE.Vector3();
    var X = new THREE.Vector3(1.0, 0.0, 0.0);
    var Y = new THREE.Vector3(0.0, 1.0, 0.0);
    var Z = new THREE.Vector3(0.0, 0.0, 1.0);
    var _tmp = new THREE.Vector3();
    var _basis = new THREE.Matrix4();
    return function(points, faces) {
        var object = new THREE.Object3D();
        var material = new THREE.MeshBasicMaterial({
            color: new THREE.Color(0xffffff),
            side: THREE.DoubleSide,
            wireframe: true,
        });
        for (var f = 0, len = faces.length; f < len; f++) {
            var face = faces[f];
            // compute centroid
            _ctr.setScalar(0.0);
            for (var i = 0, l = face.length; i < l; i++) {
                _ctr.add(points[face[i]]);
            }
            _ctr.multiplyScalar(1.0 / l);
            // compute face normal
            _plane.setFromCoplanarPoints(_ctr, points[face[0]], points[face[1]]);
            var _z = _plane.normal;
            // compute basis
            _q.setFromUnitVectors(Z, _z);
            _x.copy(X).applyQuaternion(_q);
            _y.crossVectors(_x, _z);
            _y.normalize();
            _basis.makeBasis(_x, _y, _z);
            _basis.setPosition(_ctr);
            // project the 3D points on the 2D plane
            var projPoints = [];
            for (i = 0, l = face.length; i < l; i++) {
                _tmp.subVectors(points[face[i]], _ctr);
                projPoints.push(new THREE.Vector2(_tmp.dot(_x), _tmp.dot(_y)));
            }
            // create the geometry (Three.js triangulation with ShapeBufferGeometry)
            var shape = new THREE.Shape(projPoints);
            var geometry = new THREE.ShapeBufferGeometry(shape);
            // transform geometry back to the initial coordinate system
            geometry.applyMatrix(_basis);
            // add the face to the object
            object.add(new THREE.Mesh(geometry, material));
        }
        return object;
    };
})();

// Event Listener
document.addEventListener('keydown', (e) => {
    console.log(e.code);
    switch (e.code) {
        case 'KeyA':
            camera.position.x--;
            break;
        case 'KeyD':
            camera.position.x++;
            break;
        case 'KeyW':
            camera.position.y++;
            break;
        case 'KeyS':
            camera.position.y--;
            break;
        case 'KeyZ':
            camera.position.z--;
            break;
        case 'KeyX':
            camera.position.z++;
            break;

        default:
            break;
    }
});

function init() {
    scene = new THREE.Scene();
    scene.background = new THREE.Color(0x000000);
    camera = new THREE.PerspectiveCamera(75, 4 / 3, 0.1, 1000.0);
    camera.position.z = 30;
    // camera.lookAt(new THREE.Vector3(0, 0, 0));
    renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true });
    controls = new OrbitControls(camera, renderer.domElement);
    obj = triangulateKFacesWithShapes(points, faces);
    scene.add(obj);
    window.addEventListener("resize", onWindowResize, false);
    onWindowResize();
    document.body.appendChild(renderer.domElement);

    const size = 1000;
    const divisions = 100;
    const gridHelper = new THREE.GridHelper(size, divisions);
    scene.add(gridHelper);

    // displaying critical points
    let critPoints = findCricticalPoints();
    for (let p of critPoints) {
        const geometry = new THREE.SphereGeometry(0.5, 32, 32); // (radius, widthSegments, heightSegments)
        const material = new THREE.MeshBasicMaterial({ color: 0xfff0000 });
        const sphere = new THREE.Mesh(geometry, material);
        sphere.position.x = vertices[p][0];
        sphere.position.y = vertices[p][1];
        sphere.position.z = vertices[p][2];

        scene.add(sphere);
    }
}

function onWindowResize() {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
}

function animate(time) {
    controls.update();
    // obj.rotation.x += 0.01;
    // obj.rotation.y += 0.02;

    // obj = triangulateKFacesWithShapes(points, faces);
    // scene.add(obj);

    renderer.render(scene, camera);
    requestAnimationFrame(animate);
}