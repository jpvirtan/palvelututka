// AaltoTools.js - A set of tools developed at Aalto University
// JP Virtanen (juho-pekka.virtanen@aalto.fi) 

//String cleaner for JS
function evaluateString(text) {
    console.log(text);
    if (
        text.includes("\u00AD") ||
    text.includes("\u2000") ||
        text.includes("\u2001") ||
        text.includes("\u2002") ||
        text.includes("\u2003") ||
        text.includes("\u2005") ||
        text.includes("\u2006") ||
        text.includes("\u2007") ||
        text.includes("\u2008") ||
        text.includes("\u2009") ||
        text.includes("\u2022") ||
    text.includes("\u200A") ||
    text.includes("\u200B") ||
    name.includes("\u200C") ||
    name.includes("\u200D") ||
    name.includes("\u200E") ||
    name.includes("\u200F") ||
    name.includes("\uFEFF") ||
    name.includes("\u202F") ||
    name.includes("\u202E") ||
    name.includes("\u202D") ||
    name.includes("\u202C") ||
    name.includes("\u202B") ||
    name.includes("\u202A") ||
    name.includes("\u205F") ||
    name.includes("\u2060") ||
    name.includes("\u2061") ||
    name.includes("\u2062") ||
    name.includes("\u2063") ||
    name.includes("\u2064") ||
    name.includes("\u2065") ||
    name.includes("\u2066") ||
    name.includes("\u2067") ||
    name.includes("\u2068") ||
    name.includes("\u2069") ||
    name.includes("\u206A") ||
    name.includes("\u206B") ||
    name.includes("\u206C") ||
    name.includes("\u206D") ||
    name.includes("\u206E") ||
    name.includes("\u206F")
        ) {
        console.log("Dangerous string encountered!");
    }
}


//Offset function for correcting heights of 3D tiles... 
function setHeightOffset(heightOffset, tileset) {
    var boundingSphere = tileset.boundingSphere;
    var cartographic = Cesium.Cartographic.fromCartesian(boundingSphere.center);
    var surface = Cesium.Cartesian3.fromRadians(cartographic.longitude, cartographic.latitude, 0.0);
    var offset = Cesium.Cartesian3.fromRadians(cartographic.longitude, cartographic.latitude, heightOffset);
    var translation = Cesium.Cartesian3.subtract(offset, surface, new Cesium.Cartesian3());
    tileset.modelMatrix = Cesium.Matrix4.fromTranslation(translation);
}

//General purpose move and rotate -function. Can be applied for tileset or their clipplane collections. 
//Non-incremental e.g. replaces previous transforms EXCEPT for moving, which is applied cumulatively.
function moveSetCartesianRelative(target, heading, pitch, roll, tranX, tranY, tranZ, scaleFactor) {
    var rotation = new Cesium.HeadingPitchRoll(Cesium.Math.toRadians(heading), Cesium.Math.toRadians(pitch), Cesium.Math.toRadians(roll));

    // Store position prior to translation
    var origX = target.boundingSphere.center.x;
    var origY = target.boundingSphere.center.y;
    var origZ = target.boundingSphere.center.z;

    //This is null, as the rotations and scales are applyed first
    var translation = new Cesium.Cartesian3;

    var scale = new Cesium.Cartesian3;
    scale.x = scaleFactor;
    scale.y = scaleFactor;
    scale.z = scaleFactor;

    var quaternion = new Cesium.Quaternion.fromHeadingPitchRoll(rotation);
    var transform = new Cesium.TranslationRotationScale(translation, quaternion, scale);
    var matrix4 = new Cesium.Matrix4.fromTranslationRotationScale(transform);
    target.modelMatrix = matrix4;

    // Get resulting shift
    var resX = target.boundingSphere.center.x;
    var resY = target.boundingSphere.center.y;
    var resZ = target.boundingSphere.center.z;

    // Compute resulting shift
    var shiftX = origX - resX;
    var shiftY = origY - resY;
    var shiftZ = origZ - resZ;

    console.log("Shifted on X:");
    console.log(shiftX);

    console.log("Shifted on Y:");
    console.log(shiftY);

    console.log("Shifted on Z:");
    console.log(shiftZ);

    // Apply compensation for shift
    translation.x = shiftX + tranX;
    translation.y = shiftY + tranY;
    translation.z = shiftZ + tranZ;

    // Re-compute matrix
    transform = new Cesium.TranslationRotationScale(translation, quaternion, scale);
    matrix4 = new Cesium.Matrix4.fromTranslationRotationScale(transform);
    target.modelMatrix = matrix4;
}

function moveSetCartesianAbsolute(target, heading, pitch, roll, tranX, tranY, tranZ, scaleFactor) {
    var rotation = new Cesium.HeadingPitchRoll(Cesium.Math.toRadians(heading), Cesium.Math.toRadians(pitch), Cesium.Math.toRadians(roll));

    //This is null, as the rotations and scales are applyed first
    var translation = new Cesium.Cartesian3;
    translation.x =  tranX;
    translation.y =  tranY;
    translation.z =  tranZ;

    var scale = new Cesium.Cartesian3;
    scale.x = scaleFactor;
    scale.y = scaleFactor;
    scale.z = scaleFactor;

    var quaternion = new Cesium.Quaternion.fromHeadingPitchRoll(rotation);
    var transform = new Cesium.TranslationRotationScale(translation, quaternion, scale);
    var matrix4 = new Cesium.Matrix4.fromTranslationRotationScale(transform);
    target.modelMatrix = matrix4;
}

//General purpose move and rotate -function. Can be applied for tileset or their clipplane collections. 
//Non-incremental e.g. replaces previous transforms.
function moveSetLatLon(tileset, lat, lon, heightOffset) {
    var boundingSphere = tileset.boundingSphere;
    var cartographic = Cesium.Cartographic.fromCartesian(boundingSphere.center);
    var latOffset = Cesium.Math.toRadians(lat);
    var lonOffset = Cesium.Math.toRadians(lon);
    var surface = Cesium.Cartesian3.fromRadians(cartographic.longitude, cartographic.latitude, 0.0);
    var offset = Cesium.Cartesian3.fromRadians(cartographic.longitude + lonOffset, cartographic.latitude + latOffset, heightOffset);
    var translation = Cesium.Cartesian3.subtract(offset, surface, new Cesium.Cartesian3());
    tileset.modelMatrix = Cesium.Matrix4.fromTranslation(translation);
}

//Functions for creating trim planes in various axes and geometries

//This creates a single trim plane along X-axis
function constructSingleTrimX(tileset, minX, orientation, width) {
    var planeVectorLeft = new Cesium.Cartesian3(orientation, 0.0, 0.0);
    //Clipping plane paketti
    var clippingPlanes = new Cesium.ClippingPlaneCollection({
        planes: [
            new Cesium.ClippingPlane(planeVectorLeft, minX),
        ]
    });
    tileset.clippingPlanes = clippingPlanes;
    clippingPlanes.edgeWidth = width;
}

//This creates a single trim plane along Y-axis
function constructSingleTrimY(tileset, minY, orientation, width) {
    var planeVectorTop = new Cesium.Cartesian3(0.0, orientation, 0.0);
    //Clipping plane paketti
    var clippingPlanes = new Cesium.ClippingPlaneCollection({
        planes: [
            new Cesium.ClippingPlane(planeVectorTop, minY),
        ]
    });
    tileset.clippingPlanes = clippingPlanes;
    clippingPlanes.edgeWidth = width;
}

//This creates a single trim plane along Z-axis
function constructSingleTrimZ(tileset, minZ, orientation, width) {
    var planeVectorRoof = new Cesium.Cartesian3(0.0, 0.0, orientation);
    //Clipping plane paketti
    var clippingPlanes = new Cesium.ClippingPlaneCollection({
        planes: [
            new Cesium.ClippingPlane(planeVectorRoof, minZ),
        ]
    });
    tileset.clippingPlanes = clippingPlanes;
    clippingPlanes.edgeWidth = width;
}


//This creates a "canoyon" of two paraller trim planes along X-axis
function constructTrimCanoynX(tileset, minX, maxX, width) {
    var planeVectorLeft = new Cesium.Cartesian3(-1.0, 0.0, 0.0);
    var planeVectorRight = new Cesium.Cartesian3(1.0, 0.0, 0.0);

    //Clipping plane paketti
    var clippingPlanes = new Cesium.ClippingPlaneCollection({
        planes: [
            new Cesium.ClippingPlane(planeVectorLeft, minX),
            new Cesium.ClippingPlane(planeVectorRight, maxX)
        ]
    });
    tileset.clippingPlanes = clippingPlanes;
    clippingPlanes.edgeWidth = width;
}

//This creates a "canoyon" of two paraller trim planes along Y-axis
function constructTrimCanoynY(tileset, minY, maxY, width) {
   var planeVectorTop = new Cesium.Cartesian3(0.0, -1.0, 0.0);
    var planeVectorBottom = new Cesium.Cartesian3(0.0, 1.0, 0.0);
    var clippingPlanes = new Cesium.ClippingPlaneCollection({
        planes: [
            new Cesium.ClippingPlane(planeVectorTop, minY),
            new Cesium.ClippingPlane(planeVectorBottom, maxY),
        ]
    });
    tileset.clippingPlanes = clippingPlanes;
    clippingPlanes.edgeWidth = width;
}

//This creates a "canoyon" of two paraller trim planes along Y-axis
function constructTrimCanoynZ(tileset, minZ, maxZ, width) {
    var planeVectorRoof = new Cesium.Cartesian3(0.0, 0.0, -1.0);
    var planeVectorBase = new Cesium.Cartesian3(0.0, 0.0, 1.0);
    var clippingPlanes = new Cesium.ClippingPlaneCollection({
        planes: [
            new Cesium.ClippingPlane(planeVectorRoof, minZ),
            new Cesium.ClippingPlane(planeVectorBase, maxZ),
        ]
    });
    tileset.clippingPlanes = clippingPlanes;
    clippingPlanes.edgeWidth = width;
}

//This creates a box of four trim planes (with infinite height). However, at the moment it cannot take into account the differences in 3D-tiles coordinate systems.
function constructTrimFence(tileset, minX, maxX, minY, maxY, union, width) {
    var planeVectorTop = new Cesium.Cartesian3(0.0, -1.0, 0.0);
    var planeVectorBottom = new Cesium.Cartesian3(0.0, 1.0, 0.0);
    var planeVectorLeft = new Cesium.Cartesian3(-1.0, 0.0, 0.0);
    var planeVectorRight = new Cesium.Cartesian3(1.0, 0.0, 0.0);
    //Clipping plane paketti
    var clippingPlanes = new Cesium.ClippingPlaneCollection({
        planes: [
            new Cesium.ClippingPlane(planeVectorTop, minY),
            new Cesium.ClippingPlane(planeVectorBottom, maxY),
            new Cesium.ClippingPlane(planeVectorLeft, minX),
            new Cesium.ClippingPlane(planeVectorRight, maxX)
        ]
    });
    tileset.clippingPlanes = clippingPlanes;
    clippingPlanes.edgeWidth = width;
    //This switch is required for selectively creating holes or box-crops!
    clippingPlanes.unionClippingRegions = union;
}

//This creates a box of four trim planes. However, at the moment it cannot take into account the differences in 3D-tiles coordinate systems.
function constructTrimBox(tileset, minX, maxX, minY, maxY, minZ, maxZ, union, width) {
    var planeVectorTop = new Cesium.Cartesian3(0.0, -1.0, 0.0);
    var planeVectorBottom = new Cesium.Cartesian3(0.0, 1.0, 0.0);
    var planeVectorLeft = new Cesium.Cartesian3(-1.0, 0.0, 0.0);
    var planeVectorRight = new Cesium.Cartesian3(1.0, 0.0, 0.0);
	var planeVectorFloor = new Cesium.Cartesian3(0.0, 0.0, -1.0);
	var planeVectorRoof = new Cesium.Cartesian3(0.0, 0.0, 1.0);
    //Clipping plane paketti
    var clippingPlanes = new Cesium.ClippingPlaneCollection({
        planes: [
            new Cesium.ClippingPlane(planeVectorTop, minY),
            new Cesium.ClippingPlane(planeVectorBottom, maxY),
            new Cesium.ClippingPlane(planeVectorLeft, minX),
            new Cesium.ClippingPlane(planeVectorRight, maxX),
			new Cesium.ClippingPlane(planeVectorFloor, minZ),
			new Cesium.ClippingPlane(planeVectorRoof, maxZ)
        ]
    });
    tileset.clippingPlanes = clippingPlanes;
    clippingPlanes.edgeWidth = width;
    //This switch is required for selectively creating holes or box-crops!
    clippingPlanes.unionClippingRegions = union;
}


