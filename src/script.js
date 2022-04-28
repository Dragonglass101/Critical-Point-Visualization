// // importing required packages
import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";
import * as dat from "dat.gui";
import { NumberKeyframeTrack } from "three";
// const gui = new dat.GUI()

var arr = [];
// horse seashell bunny cube sphere5 sphere20 Tangle Torus space_station x_wing helix2 RzTorus
function readTextFile() {
    var rawFile = new XMLHttpRequest();
    rawFile.open("GET", "RzTorus.gts", true);
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
var stats;
const EdgeGeometrys = [];
const Scale = 5;

const vertices = [
    [0, 0, 0]
];
class Vertex {
    constructor(x, y, z) {
        this.x = x;
        this.y = y;
        this.z = z;
    }
}
const points = [];
const edges = [null];
const faces = [];

let num_vertices, num_edges, num_triangles;
let betti0 = 0,
    betti1 = 0,
    betti2 = 0;

let markedPointRadii = { radius: 1 };

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
        return (((1 * Scale) * (1 * Scale) - (x * x) - (y * y)));
    }
    for (i = 1; i <= num_vertices; i++) {
        let [x, y, z] = arr[i].split(" ");
        let X = Scale * Number(x);
        let Y = Scale * Number(y);
        let Z = Scale * Number(z);
        let vertex = new Vertex(X, Y, Z);

        vertices.push(vertex);

        // if (Z >= 0)
        //     heightFunctionList[i] = sphereHeightFunction(X, Y);
        // if (Z < 0)
        //     heightFunctionList[i] = -sphereHeightFunction(X, Y);
        heightFunctionList[i] = Z;
        // heightFunctionList[i] = Math.random();
    }

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


    // sorting faces wrt coordinates
    function compare(a, b) {
        if (vertices[a[0]].z < vertices[b[0]].z) {
            return -1;
        }
        if (vertices[a[0]].z > vertices[b[0]].z) {
            return 1;
        }
        return 0;
    }

    faces.sort(compare);

    console.log(vertices);
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
    let minimaPoints = [];
    let maximaPoints = [];
    let saddlePoints = [];
    for (let i = 1; i <= num_vertices; i++) {
        // findMaximums(i);
        // findSaddles(i);
        let heigthOfi = heightFunctionList[i];
        let i_link = LinkStruct[i];
        let currSign;
        let numberOfChangeOfSign = 0;

        if (heightFunctionList[i_link[0]] > heigthOfi)
            currSign = 1;
        if (heightFunctionList[i_link[0]] < heigthOfi)
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
            if (heightFunctionList[node] === heigthOfi)
                numberOfChangeOfSign += 0
        }
        if (numberOfChangeOfSign === 0) {
            if (currSign === 1) {
                betti0++;
                minimaPoints.push(i);
            }
            if (currSign === -1) {
                betti2++;
                maximaPoints.push(i);
            }
            // console.log("Maxima or Minima", i);
            // console.log(LinkStruct[i], heigthOfi);
            // for (let node of i_link) {
            //     console.log(heightFunctionList[node], node);
            // }

        }
        if (numberOfChangeOfSign === 3 || numberOfChangeOfSign === 4) {
            betti1++;
            // console.log("Saddle", i);
            // console.log(LinkStruct[i], heigthOfi);
            // for (let node of i_link) {
            //     console.log(heightFunctionList[node], node);
            // }
            saddlePoints.push(i);
        }
        if (numberOfChangeOfSign != 0 && numberOfChangeOfSign != 3 && numberOfChangeOfSign != 1 && numberOfChangeOfSign != 2 && numberOfChangeOfSign != 4)
            console.log("number of sign changes: ", numberOfChangeOfSign);
    }
    return [minimaPoints, maximaPoints, saddlePoints];
}


function makePoints() {
    points[0] = null;
    for (let i = 1; i <= num_vertices; i++) {
        points.push(new THREE.Vector3(vertices[i].x, vertices[i].y, vertices[i].z));
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
            var temp_face = new THREE.Mesh(geometry, material);
            object.add(temp_face);
            EdgeGeometrys.push(temp_face);
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

function displayCriticalPoints() {
    // displaying critical points
    let [minimaPoints, maximaPoints, saddlePoints] = findCricticalPoints();
    console.log(maximaPoints.length, saddlePoints.length)
    for (let p of maximaPoints) {
        const geometry = new THREE.SphereGeometry(markedPointRadii.radius, 32, 32); // (radius, widthSegments, heightSegments)
        const material = new THREE.MeshBasicMaterial({ color: 0xff0000 });
        const sphere = new THREE.Mesh(geometry, material);
        sphere.name = `maxPoint${p}`;
        sphere.position.x = vertices[p].x;
        sphere.position.y = vertices[p].y;
        sphere.position.z = vertices[p].z;

        scene.add(sphere);
    }
    for (let p of saddlePoints) {
        const geometry = new THREE.SphereGeometry(markedPointRadii.radius, 32, 32); // (radius, widthSegments, heightSegments)
        const material = new THREE.MeshBasicMaterial({ color: 0xff00 });
        const sphere = new THREE.Mesh(geometry, material);
        sphere.name = `saddlePoint${p}`
        sphere.position.x = vertices[p].x;
        sphere.position.y = vertices[p].y;
        sphere.position.z = vertices[p].z;

        scene.add(sphere);
    }
    for (let p of minimaPoints) {
        const geometry = new THREE.SphereGeometry(markedPointRadii.radius, 32, 32); // (radius, widthSegments, heightSegments)
        const material = new THREE.MeshBasicMaterial({ color: 0xffff00 });
        const sphere = new THREE.Mesh(geometry, material);
        sphere.name = `saddlePoint${p}`
        sphere.position.x = vertices[p].x;
        sphere.position.y = vertices[p].y;
        sphere.position.z = vertices[p].z;

        scene.add(sphere);
    }

}

function init() {
    scene = new THREE.Scene();
    scene.background = new THREE.Color(0x000000);
    camera = new THREE.PerspectiveCamera(75, 4 / 3, 0.1, 1000.0);
    camera.position.z = 80;
    // camera.lookAt(new THREE.Vector3(0, 0, 0));
    renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true });
    controls = new OrbitControls(camera, renderer.domElement);

    obj = triangulateKFacesWithShapes(points, faces);
    // scene.add(obj);

    newObj = new THREE.Object3D();
    for (let f = 0; f < frames; f++) {
        newObj.add(EdgeGeometrys[f]);
    }
    scene.add(newObj);

    window.addEventListener("resize", onWindowResize, false);
    onWindowResize();
    document.body.appendChild(renderer.domElement);

    const size = 1000;
    const divisions = 100;
    const gridHelper = new THREE.GridHelper(size, divisions);
    scene.add(gridHelper);

    displayCriticalPoints();

    // const Controls = gui.addFolder('Controls')
    // Controls.add(obj.rotation, 'x', 0, Math.PI * 2);
    // Controls.add(obj.rotation, 'y', 0, Math.PI * 2);
    // Controls.add(obj.rotation, 'z', 0, Math.PI * 2);
    // Controls.add(markedPointRadii, 'radius', 0, 10);
    // Controls.open()

    console.log("betti0:", betti0, "  betti1:", betti1, "  betti2:", betti2);
}

function onWindowResize() {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
}

let frames = 0;
let newObj = new THREE.Object3D();
let perFrameIncrement = 50;

function animate(time) {
    controls.update();

    if (frames % 1 === 0) {
        if (frames * perFrameIncrement <= num_triangles) {
            scene.remove(newObj);
            newObj = new THREE.Object3D();
            for (let f = 0; f < frames * perFrameIncrement; f++) {
                newObj.add(EdgeGeometrys[f]);
            }
            scene.add(newObj);
        }
    }

    // scene.remove(newObj);
    // newObj = new THREE.Object3D();
    // for (let f = 0; f < num_triangles; f++) {
    //     newObj.add(EdgeGeometrys[f]);
    // }
    // scene.add(newObj);

    if (frames * perFrameIncrement <= num_triangles)
        frames++;

    renderer.render(scene, camera);
    requestAnimationFrame(animate);
}