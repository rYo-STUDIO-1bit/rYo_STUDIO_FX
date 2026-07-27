// host.jsx - ExtendScript host handlers for After Effects & Premiere Pro

function importAssetToAE(filePath) {
    try {
        app.beginUndoGroup("Import Master Asset");
        var fileRef = new File(filePath);
        if (fileRef.exists) {
            var importOpts = new ImportOptions(fileRef);
            var item = app.project.importFile(importOpts);
            app.endUndoGroup();
            return "SUCCESS: " + item.name;
        } else {
            app.endUndoGroup();
            return "ERROR: File does not exist at " + filePath;
        }
    } catch(e) {
        return "ERROR: " + e.toString();
    }
}

function applyPaperFoldRig() {
    try {
        app.beginUndoGroup("Paper Fold Rig");
        var comp = app.project.activeItem;
        if (comp != null && comp instanceof CompItem) {
            var selectedLayers = comp.selectedLayers;
            if (selectedLayers.length > 0) {
                for (var i = 0; i < selectedLayers.length; i++) {
                    var layer = selectedLayers[i];
                    layer.threeDLayer = true;
                    
                    var foldControl = layer.property("Effects").addProperty("Slider Control");
                    foldControl.name = "Fold Amount";
                    foldControl.property("Slider").setValue(100);
                    
                    var xRotExpr = 
                        "var fold = effect('Fold Amount')('Slider');\n" +
                        "var amp = 0.15, freq = 2.0, decay = 5.0;\n" +
                        "var n = 0;\n" +
                        "if (fold.numKeys > 0){\n" +
                        "  n = fold.nearestKey(time).index;\n" +
                        "  if (fold.key(n).time > time) n--;\n" +
                        "}\n" +
                        "if (n == 0){\n" +
                        "  value - (fold / 100 * 90);\n" +
                        "} else {\n" +
                        "  var t = time - fold.key(n).time;\n" +
                        "  if (t > 0){\n" +
                        "    var v = fold.velocityAtTime(fold.key(n).time - thisComp.frameDuration/10);\n" +
                        "    value - (fold / 100 * 90) + (v/100 * 90) * amp * Math.sin(freq * t * 2 * Math.PI) / Math.exp(decay * t);\n" +
                        "  } else {\n" +
                        "    value - (fold / 100 * 90);\n" +
                        "  }\n" +
                        "}";
                    
                    layer.property("Transform").property("X Rotation").expression = xRotExpr;
                    var layerHeight = layer.source ? layer.source.height : layer.height;
                    var currentAnchor = layer.property("Transform").property("Anchor Point").value;
                    var currentPos = layer.property("Transform").property("Position").value;
                    layer.property("Transform").property("Anchor Point").setValue([currentAnchor[0], layerHeight, currentAnchor[2]]);
                    layer.property("Transform").property("Position").setValue([currentPos[0], currentPos[1] + (layerHeight/2), currentPos[2]]);
                }
                app.endUndoGroup();
                return "SUCCESS: Rigged " + selectedLayers.length + " layer(s)";
            }
            app.endUndoGroup();
            return "ERROR: No layers selected";
        }
        app.endUndoGroup();
        return "ERROR: No active comp";
    } catch(e) {
        return "ERROR: " + e.toString();
    }
}