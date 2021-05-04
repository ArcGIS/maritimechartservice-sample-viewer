/*
 | Copyright 2014 Esri
 |
 | Licensed under the Apache License, Version 2.0 (the "License");
 | you may not use this file except in compliance with the License.
 | You may obtain a copy of the License at
 |
 |    http://www.apache.org/licenses/LICENSE-2.0
 |
 | Unless required by applicable law or agreed to in writing, software
 | distributed under the License is distributed on an "AS IS" BASIS,
 | WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 | See the License for the specific language governing permissions and
 | limitations under the License.
 */

define([
    'dojo/on',
    'dojo/topic',
    'dojo/query',
    "dojo/_base/declare",
    'dojo/_base/lang',
    'dojo/_base/array'
], function (on, topic, query, declare, lang, array) {

    declare("MCSWidgetUtilities", null, {});


    MCSWidgetUtilities.setupControls = function () {
        var dispObj = JSON.parse(this.MCSLayerConfig.parametersContent);
        var params = dispObj.ECDISParameters.DynamicParameters.Parameter;
        var dynamicHtml;

        function isGroupParameter(checkparam) {
            return (checkparam === 'AreaSymbolSize' || checkparam === 'DatasetDisplayRange' || checkparam === 'LineSymbolSize'
                || checkparam === 'PointSymbolSize' || checkparam === 'TextSize' || checkparam === 'TextGroups');
        }

        if (this.MCSLayerConfig.controls && this.MCSLayerConfig.controls.length > 0) {
            var ctrlArr = this.MCSLayerConfig.controls.split(",");
            for (var i = 0; i < ctrlArr.length; i++) {
                if (!this[ctrlArr[i]])
                    continue;  //bypass all non-supported parameters
                this[ctrlArr[i]].style.display = "block";
                if (!isGroupParameter(ctrlArr[i])) {
                    for (var j = 0; j < params.length; j++) {
                        dynamicHtml = "";
                        if (params[j].name === ctrlArr[i]) {
                            switch (ctrlArr[i]) {
                                case "AreaSymbolizationType":
                                case "ColorScheme":
                                case "DisplayDepthUnits":
                                case "DisplayFrames":
                                case "PointSymbolizationType":
                                case "AttDesc":
                                case "DisplayFrameText":
                                case "DisplayFrameTextPlacement":
                                    for (var k = 0; k < params[j].ExpectedInput.length; k++) {
                                        if (params[j].value === params[j].ExpectedInput[k].code)
                                            dynamicHtml += "<option value='" + params[j].ExpectedInput[k].code + "' selected='selected'>" + params[j].ExpectedInput[k].value + "</option>";
                                        else
                                            dynamicHtml += "<option value='" + params[j].ExpectedInput[k].code + "'>" + params[j].ExpectedInput[k].value + "</option>";
                                    }
                                    this[ctrlArr[i] + "Ctrl"].innerHTML = dynamicHtml;
                                    break;
                                case "DisplayCategory":
                                case "IntendedUsage":
                                case "DisplayAIOFeatures":
                                    var filter = params[j].value;
                                    if (filter.substr(0, 1) == "0") filter = "0"; // to handle special case for IntendedUsage
                                    var selValues = filter.split(',');
                                    for (var k = 0; k < params[j].ExpectedInput.length; k++) {
                                        var curChecked = false;
                                        if (array.indexOf(selValues, params[j].ExpectedInput[k].code) >= 0)
                                            curChecked = true;
                                        if (curChecked)
                                            dynamicHtml += "<label><input type='checkbox' id='dbox" + (k + 1) + "' value='" + params[j].ExpectedInput[k].code + "' checked/>" + params[j].ExpectedInput[k].value + "</label><br/>";
                                        else
                                            dynamicHtml += "<label><input type='checkbox' id='dbox" + (k + 1) + "' value='" + params[j].ExpectedInput[k].code + "'/>" + params[j].ExpectedInput[k].value + "</label><br/>";
                                    }
                                    this[ctrlArr[i] + "Ctrl"].innerHTML = dynamicHtml;
                                    break;
                                case "CompassRose":
                                case "DataQuality":
                                case "DisplayNOBJNM":
                                case "OptionalDeepSoundings":
                                case "IsolatedDangers":
                                case "HonorScamin":
                                case "ShallowDepthPattern":
                                case "LabelContours":
                                case "LabelSafetyContours":
                                case "TwoDepthShades":
                                case "TextHalo":
                                case "RemoveDuplicateText":
                                case "DisplayBathymetricIENC":
                                case "DisplayLightSectors":
                                case "DisplaySafeSoundings":
                                case "DateDependencySymbols":
                                case "MovingCentroid":
                                    if (params[j].value == "2")
                                        this[ctrlArr[i] + "Ctrl"].set("checked", true);
                                    break;
                                case "DateDependencyRange":
                                    this["DateDependencyRangeFromCtrl"].set("value", new Date());
                                    this["DateDependencyRangeToCtrl"].set("value", new Date());
                                    break;
                            }
                            break;
                        }
                    }
                }
                else {
                    var parameterGroupsArray = dispObj.ECDISParameters.DynamicParameters.ParameterGroup;
                    var grpParameter = parameterGroupsArray[MCSWidgetUtilities.findParameter(parameterGroupsArray, ctrlArr[i])];
                    if (grpParameter) {
                        nestedParams = grpParameter.Parameter;
                        switch (ctrlArr[i]) {
                            case "TextGroups":
                                // text groups or Intended Usage
                                var dynamicHtml = "";
                                for (var j = 0; j < nestedParams.length; j++) {
                                    if (nestedParams[j].value == "2")
                                        dynamicHtml += "<label><input type='checkbox' id='dbox" + nestedParams[j].name + "' value='" + nestedParams[j].name + "' checked/>" + nestedParams[j].Description + "</label><br/>";
                                    else
                                        dynamicHtml += "<label><input type='checkbox' id='dbox" + nestedParams[j].name + "' value='" + nestedParams[j].name + "'/>" + nestedParams[j].Description + "</label><br/>";
                                }
                                this[ctrlArr[i] + "Ctrl"].innerHTML = dynamicHtml;
                                break;
                            case "DatasetDisplayRange":
                            case "AreaSymbolSize":
                            case "LineSymbolSize":
                            case "PointSymbolSize":
                            case "TextSize":
                                this[ctrlArr[i]].style.display = "none";
                                this["symbol_size_tab_header"].style.display = "block";
                                this["SymbolSizeContainer"].style.display = "block";
                                break;
                        }
                    }
                }
            }
        }
        if (dispObj.ECDISParameters.StaticParameters) {
            var params = dispObj.ECDISParameters.StaticParameters.Parameter;
            var dynamicHtml;
            if (this.MCSLayerConfig.controls && this.MCSLayerConfig.controls.length > 0) {
                var ctrlArr = this.MCSLayerConfig.controls.split(",");
                for (var i = 0; i < ctrlArr.length; i++) {
                    if (!this[ctrlArr[i]])
                        continue;  //bypass all non-supported parameters
                    this[ctrlArr[i]].style.display = "block";
                    if (!isGroupParameter(ctrlArr[i])) {
                        for (var j = 0; j < params.length; j++) {
                            dynamicHtml = "";
                            if (params[j].name === ctrlArr[i]) {
                                switch (ctrlArr[i]) {
                                    case "AreaSymbolizationType":
                                    case "PointSymbolizationType":
                                        for (var k = 0; k < params[j].ExpectedInput.length; k++) {
                                            if (params[j].value === params[j].ExpectedInput[k].code)
                                                dynamicHtml += "<option value='" + params[j].ExpectedInput[k].code + "' selected='selected'>" + params[j].ExpectedInput[k].value + "</option>";
                                            else
                                                dynamicHtml += "<option value='" + params[j].ExpectedInput[k].code + "'>" + params[j].ExpectedInput[k].value + "</option>";
                                        }
                                        this[ctrlArr[i] + "Ctrl"].innerHTML = dynamicHtml;
                                        break;
                                }
                                break;
                            }
                        }
                    }
                }
            }
        }
        var parametersArray = this.MCSLayerConfig.s57CustomLayer.displayParameters.ECDISParameters.DynamicParameters.Parameter;
        if (this["input_shallow_contour"])
            this.input_shallow_contour.value = parametersArray[MCSWidgetUtilities.findParameter(parametersArray, 'ShallowContour')].value.toString();
        if (this["input_safety_contour"])
            this.input_safety_contour.value = parametersArray[MCSWidgetUtilities.findParameter(parametersArray, 'SafetyContour')].value.toString();

        if (this["input_safety_depth"] && this["safety_depth_block"]) {
            if (this.includeParameters['SafetyDepth']) // TO make the safety depth parameter backward compatible.  @TODO: make other contour parameters controllable. 
                this.input_safety_depth.value = parametersArray[MCSWidgetUtilities.findParameter(parametersArray, 'SafetyDepth')].value.toString();
            else {
                this["safety_depth_block"].innerHTML = "";
            }
        }
        if (this["input_deep_contour"])
            this.input_deep_contour.value = parametersArray[MCSWidgetUtilities.findParameter(parametersArray, 'DeepContour')].value.toString();

        MCSWidgetUtilities._initEventHandlers.call(this);
    };

    MCSWidgetUtilities._initEventHandlers = function () {
        var _this = this;
        if (this["ColorSchemeCtrl"])
            this.own(on(this.ColorSchemeCtrl, 'change', lang.hitch(this, function () {
                var parametersArray = this.MCSLayerConfig.s57CustomLayer.displayParameters.ECDISParameters.DynamicParameters.Parameter;
                parametersArray[MCSWidgetUtilities.findParameter(parametersArray, "ColorScheme")].value = parseInt(_this.ColorSchemeCtrl.value, 10);
                this.MCSLayerConfig.s57CustomLayer.refresh();
            })));
        if (this["AttDescCtrl"])
            this.own(on(this.AttDescCtrl, 'change', lang.hitch(this, function () {
                var parametersArray = this.MCSLayerConfig.s57CustomLayer.displayParameters.ECDISParameters.DynamicParameters.Parameter;
                parametersArray[MCSWidgetUtilities.findParameter(parametersArray, "AttDesc")].value = parseInt(_this.AttDescCtrl.value, 10);
                this.MCSLayerConfig.s57CustomLayer.refresh();
            })));
        if (this["DisplayFrameTextCtrl"])
            this.own(on(this.DisplayFrameTextCtrl, 'change', lang.hitch(this, function () {
                var parametersArray = this.MCSLayerConfig.s57CustomLayer.displayParameters.ECDISParameters.DynamicParameters.Parameter;
                parametersArray[MCSWidgetUtilities.findParameter(parametersArray, "DisplayFrameText")].value = parseInt(_this.DisplayFrameTextCtrl.value, 10);
                this.MCSLayerConfig.s57CustomLayer.refresh();
            })));
        if (this["DisplayFrameTextPlacementCtrl"])
            this.own(on(this.DisplayFrameTextPlacementCtrl, 'change', lang.hitch(this, function () {
                var parametersArray = this.MCSLayerConfig.s57CustomLayer.displayParameters.ECDISParameters.DynamicParameters.Parameter;
                parametersArray[MCSWidgetUtilities.findParameter(parametersArray, "DisplayFrameTextPlacement")].value = parseInt(_this.DisplayFrameTextPlacementCtrl.value, 10);
                this.MCSLayerConfig.s57CustomLayer.refresh();
            })));
        if (this["DisplayDepthUnitsCtrl"])
            this.own(on(this.DisplayDepthUnitsCtrl, 'change', lang.hitch(this, function () {
                var parametersArray = this.MCSLayerConfig.s57CustomLayer.displayParameters.ECDISParameters.DynamicParameters.Parameter;
                parametersArray[MCSWidgetUtilities.findParameter(parametersArray, "DisplayDepthUnits")].value = parseInt(_this.DisplayDepthUnitsCtrl.value, 10);
                this.MCSLayerConfig.s57CustomLayer.refresh();
            })));
        if (this["TwoDepthShadesCtrl"])
            this.own(on(this.TwoDepthShadesCtrl, 'change', lang.hitch(this, function () {
                var parametersArray = this.MCSLayerConfig.s57CustomLayer.displayParameters.ECDISParameters.DynamicParameters.Parameter;
                parametersArray[MCSWidgetUtilities.findParameter(parametersArray, "TwoDepthShades")].value = _this.TwoDepthShadesCtrl.checked ? 2 : 1;
                this.MCSLayerConfig.s57CustomLayer.refresh();
            })));
        if (this["ShallowDepthPatternCtrl"])
            this.own(on(this.ShallowDepthPatternCtrl, 'change', lang.hitch(this, function () {
                var parametersArray = this.MCSLayerConfig.s57CustomLayer.displayParameters.ECDISParameters.DynamicParameters.Parameter;
                parametersArray[MCSWidgetUtilities.findParameter(parametersArray, "ShallowDepthPattern")].value = _this.ShallowDepthPatternCtrl.checked ? 2 : 1;
                this.MCSLayerConfig.s57CustomLayer.refresh();
            })));
        if (this["PointSymbolizationTypeCtrl"])
            this.own(on(this.PointSymbolizationTypeCtrl, 'change', lang.hitch(this, function () {
                var parametersArray = this.MCSLayerConfig.s57CustomLayer.displayParameters.ECDISParameters.DynamicParameters.Parameter;
                if (MCSWidgetUtilities.findParameter(parametersArray, "PointSymbolizationType") > -1) {
                    parametersArray[MCSWidgetUtilities.findParameter(parametersArray, "PointSymbolizationType")].value = parseInt(_this.PointSymbolizationTypeCtrl.value, 10);
                    this.MCSLayerConfig.s57CustomLayer.refresh();
                }
                else {
                    var parametersArray = this.MCSLayerConfig.s57CustomLayer.displayParameters.ECDISParameters.StaticParameters.Parameter;
                    if (MCSWidgetUtilities.findParameter(parametersArray, "PointSymbolizationType") > -1) {
                        parametersArray[MCSWidgetUtilities.findParameter(parametersArray, "PointSymbolizationType")].value = parseInt(_this.PointSymbolizationTypeCtrl.value, 10);
                        this.MCSLayerConfig.s57CustomLayer.refresh();
                    }
                }
            })));
        if (this["AreaSymbolizationTypeCtrl"])
            this.own(on(this.AreaSymbolizationTypeCtrl, 'change', lang.hitch(this, function () {
                var parametersArray = this.MCSLayerConfig.s57CustomLayer.displayParameters.ECDISParameters.DynamicParameters.Parameter;
                if (MCSWidgetUtilities.findParameter(parametersArray, "AreaSymbolizationType") > -1) {
                    parametersArray[MCSWidgetUtilities.findParameter(parametersArray, "AreaSymbolizationType")].value = parseInt(_this.AreaSymbolizationTypeCtrl.value, 10);
                    this.MCSLayerConfig.s57CustomLayer.refresh();
                }
                else {
                    var parametersArray = this.MCSLayerConfig.s57CustomLayer.displayParameters.ECDISParameters.StaticParameters.Parameter;
                    if (MCSWidgetUtilities.findParameter(parametersArray, "AreaSymbolizationType") > -1) {
                        parametersArray[MCSWidgetUtilities.findParameter(parametersArray, "AreaSymbolizationType")].value = parseInt(_this.AreaSymbolizationTypeCtrl.value, 10);
                        this.MCSLayerConfig.s57CustomLayer.refresh();
                    }
                }
            })));
        if (this["DisplayBathymetricIENCCtrl"])
            this.own(on(this.DisplayBathymetricIENCCtrl, 'change', lang.hitch(this, function () {
                var parametersArray = this.MCSLayerConfig.s57CustomLayer.displayParameters.ECDISParameters.DynamicParameters.Parameter;
                parametersArray[MCSWidgetUtilities.findParameter(parametersArray, "DisplayBathymetricIENC")].value = _this.DisplayBathymetricIENCCtrl.checked ? 2 : 1;
                this.MCSLayerConfig.s57CustomLayer.refresh();
            })));
        if (this["DisplayFramesCtrl"])
            this.own(on(this.DisplayFramesCtrl, 'change', lang.hitch(this, function () {
                var parametersArray = this.MCSLayerConfig.s57CustomLayer.displayParameters.ECDISParameters.DynamicParameters.Parameter;
                parametersArray[MCSWidgetUtilities.findParameter(parametersArray, "DisplayFrames")].value = parseInt(_this.DisplayFramesCtrl.value, 10);
                this.MCSLayerConfig.s57CustomLayer.refresh();
            })));
        if (this["HonorScaminCtrl"])
            this.own(on(this.HonorScaminCtrl, 'change', lang.hitch(this, function () {
                var parametersArray = this.MCSLayerConfig.s57CustomLayer.displayParameters.ECDISParameters.DynamicParameters.Parameter;
                parametersArray[MCSWidgetUtilities.findParameter(parametersArray, "HonorScamin")].value = _this.HonorScaminCtrl.checked ? 2 : 1;
                this.MCSLayerConfig.s57CustomLayer.refresh();
            })));
        if (this["DisplayLightSectorsCtrl"])
            this.own(on(this.DisplayLightSectorsCtrl, 'change', lang.hitch(this, function () {
                var parametersArray = this.MCSLayerConfig.s57CustomLayer.displayParameters.ECDISParameters.DynamicParameters.Parameter;
                parametersArray[MCSWidgetUtilities.findParameter(parametersArray, "DisplayLightSectors")].value = _this.DisplayLightSectorsCtrl.checked ? 2 : 1;
                this.MCSLayerConfig.s57CustomLayer.refresh();
            })));
        if (this["DisplaySafeSoundingsCtrl"])
            this.own(on(this.DisplaySafeSoundingsCtrl, 'change', lang.hitch(this, function () {
                var parametersArray = this.MCSLayerConfig.s57CustomLayer.displayParameters.ECDISParameters.DynamicParameters.Parameter;
                parametersArray[MCSWidgetUtilities.findParameter(parametersArray, "DisplaySafeSoundings")].value = _this.DisplaySafeSoundingsCtrl.checked ? 2 : 1;
                this.MCSLayerConfig.s57CustomLayer.refresh();
            })));
        if (this["MovingCentroidCtrl"])
            this.own(on(this.MovingCentroidCtrl, 'change', lang.hitch(this, function () {
                var parametersArray = this.MCSLayerConfig.s57CustomLayer.displayParameters.ECDISParameters.DynamicParameters.Parameter;
                parametersArray[MCSWidgetUtilities.findParameter(parametersArray, "MovingCentroid")].value = _this.MovingCentroidCtrl.checked ? 2 : 1;
                this.MCSLayerConfig.s57CustomLayer.refresh();
            })));
        if (this["RemoveDuplicateTextCtrl"])
            this.own(on(this.RemoveDuplicateTextCtrl, 'change', lang.hitch(this, function () {
                var parametersArray = this.MCSLayerConfig.s57CustomLayer.displayParameters.ECDISParameters.DynamicParameters.Parameter;
                parametersArray[MCSWidgetUtilities.findParameter(parametersArray, "RemoveDuplicateText")].value = _this.RemoveDuplicateTextCtrl.checked ? 2 : 1;
                this.MCSLayerConfig.s57CustomLayer.refresh();
            })));
        if (this["TextHaloCtrl"])
            this.own(on(this.TextHaloCtrl, 'change', lang.hitch(this, function () {
                var parametersArray = this.MCSLayerConfig.s57CustomLayer.displayParameters.ECDISParameters.DynamicParameters.Parameter;
                parametersArray[MCSWidgetUtilities.findParameter(parametersArray, "TextHalo")].value = _this.TextHaloCtrl.checked ? 2 : 1;
                this.MCSLayerConfig.s57CustomLayer.refresh();
            })));
        if (this["DisplayNOBJNMCtrl"])
            this.own(on(this.DisplayNOBJNMCtrl, 'change', lang.hitch(this, function () {
                var parametersArray = this.MCSLayerConfig.s57CustomLayer.displayParameters.ECDISParameters.DynamicParameters.Parameter;
                parametersArray[MCSWidgetUtilities.findParameter(parametersArray, "DisplayNOBJNM")].value = _this.DisplayNOBJNMCtrl.checked ? 2 : 1;
                this.MCSLayerConfig.s57CustomLayer.refresh();
            })));
//////////////////////////////////////////////////////////////////////////////////////////
        
        topic.subscribe("mcs/setSafetyContour", lang.hitch(this, function () {
            _this.input_safety.value = parseFloat(arguments[0][0], 10).toString();
            var parametersArray = this.MCSLayerConfig.s57CustomLayer.displayParameters.ECDISParameters.DynamicParameters.Parameter;
            parametersArray[MCSWidgetUtilities.findParameter(parametersArray, "SafetyContour")].value = parseFloat(_this.input_safety.value, 10);
            this.MCSLayerConfig.s57CustomLayer.refresh();
        }));
//////////////////////////////////////////////////////////////////////////////
        if (this["DataQualityCtrl"])
            this.own(on(this.DataQualityCtrl, 'change', lang.hitch(this, function () {
                var parametersArray = this.MCSLayerConfig.s57CustomLayer.displayParameters.ECDISParameters.DynamicParameters.Parameter;
                parametersArray[MCSWidgetUtilities.findParameter(parametersArray, "DataQuality")].value = _this.DataQualityCtrl.checked ? 2 : 1;
                this.MCSLayerConfig.s57CustomLayer.refresh();
            })));
        if (this["DateDependencySymbolsCtrl"])
            this.own(on(this.DateDependencySymbolsCtrl, 'change', lang.hitch(this, function () {
                var parametersArray = this.MCSLayerConfig.s57CustomLayer.displayParameters.ECDISParameters.DynamicParameters.Parameter;
                parametersArray[MCSWidgetUtilities.findParameter(parametersArray, "DateDependencySymbols")].value = _this.DateDependencySymbolsCtrl.checked ? 2 : 1;
                this.MCSLayerConfig.s57CustomLayer.refresh();
            })));
        if (this["DateDependencyRangeFromCtrl"])
            this.own(on(this.DateDependencyRangeFromCtrl, 'change', lang.hitch(this, function () {
                // toCtrl.constraints.min = fromCtrl.value;
                if (!(_this.DateDependencyRangeFromCtrl.isValid() && _this.DateDependencyRangeToCtrl.isValid())) return;
                if (_this.DateDependencyRangeFromCtrl.value > _this.DateDependencyRangeToCtrl.value) {
                    _this.DateDependencyRangeToCtrl.set("value", _this.DateDependencyRangeFromCtrl.value);
                    return; //prevent sending request twice. DateDependencyRangeToCtrl will handle the event after the value change
                }

                var from = _this.DateDependencyRangeFromCtrl.value;
                var yyyy1 = from.getFullYear().toString();
                var mm1 = (from.getMonth() + 1).toString();
                if (mm1.length == 1) mm1 = '0' + mm1;
                var dd1 = from.getDate().toString();
                if (dd1.length == 1) dd1 = '0' + dd1;

                var to = _this.DateDependencyRangeToCtrl.value;
                yyyy2 = to.getFullYear().toString();
                mm2 = (to.getMonth() + 1).toString();
                if (mm2.length == 1) mm2 = '0' + mm2;
                dd2 = to.getDate().toString();
                if (dd2.length == 1) dd2 = '0' + dd2;

                var drange = yyyy1 + mm1 + dd1 + "-" + yyyy2 + mm2 + dd2;

                var parametersArray = this.MCSLayerConfig.s57CustomLayer.displayParameters.ECDISParameters.DynamicParameters.Parameter;
                parametersArray[MCSWidgetUtilities.findParameter(parametersArray, "DateDependencyRange")].value = drange;
                this.MCSLayerConfig.s57CustomLayer.refresh();
            })));
        if (this["DateDependencyRangeToCtrl"])
            this.own(on(this.DateDependencyRangeToCtrl, 'change', lang.hitch(this, function () {
                // fromCtrl.constraints.max = toCtrl.value;
                if (!(_this.DateDependencyRangeFromCtrl.isValid() && _this.DateDependencyRangeToCtrl.isValid())) return;
                if (_this.DateDependencyRangeToCtrl.value < _this.DateDependencyRangeFromCtrl.value) {
                    _this.DateDependencyRangeFromCtrl.set("value", _this.DateDependencyRangeToCtrl.value);
                    return; //prevent sending request twice. DateDependencyRangeFromCtrl will handle the event after the value change
                }

                var from = _this.DateDependencyRangeFromCtrl.value;
                var yyyy1 = from.getFullYear().toString();
                var mm1 = (from.getMonth() + 1).toString();
                if (mm1.length == 1) mm1 = '0' + mm1;
                var dd1 = from.getDate().toString();
                if (dd1.length == 1) dd1 = '0' + dd1;

                var to = _this.DateDependencyRangeToCtrl.value;
                yyyy2 = to.getFullYear().toString();
                mm2 = (to.getMonth() + 1).toString();
                if (mm2.length == 1) mm2 = '0' + mm2;
                dd2 = to.getDate().toString();
                if (dd2.length == 1) dd2 = '0' + dd2;

                var drange = yyyy1 + mm1 + dd1 + "-" + yyyy2 + mm2 + dd2;

                var parametersArray = this.MCSLayerConfig.s57CustomLayer.displayParameters.ECDISParameters.DynamicParameters.Parameter;
                parametersArray[MCSWidgetUtilities.findParameter(parametersArray, "DateDependencyRange")].value = drange;
                this.MCSLayerConfig.s57CustomLayer.refresh();
            })));
        if (this["CompassRoseCtrl"])
            this.own(on(this.CompassRoseCtrl, 'change', lang.hitch(this, function () {
                var parametersArray = this.MCSLayerConfig.s57CustomLayer.displayParameters.ECDISParameters.DynamicParameters.Parameter;
                parametersArray[MCSWidgetUtilities.findParameter(parametersArray, "CompassRose")].value = _this.CompassRoseCtrl.checked ? 2 : 1;
                this.MCSLayerConfig.s57CustomLayer.refresh();
            })));
        if (this["IsolatedDangersCtrl"])
            this.own(on(this.IsolatedDangersCtrl, 'change', lang.hitch(this, function () {
                var parametersArray = this.MCSLayerConfig.s57CustomLayer.displayParameters.ECDISParameters.DynamicParameters.Parameter;
                parametersArray[MCSWidgetUtilities.findParameter(parametersArray, "IsolatedDangers")].value = _this.IsolatedDangersCtrl.checked ? 2 : 1;
                this.MCSLayerConfig.s57CustomLayer.refresh();
            })));
        if (this["LabelContoursCtrl"])
            this.own(on(this.LabelContoursCtrl, 'change', lang.hitch(this, function () {
                var parametersArray = this.MCSLayerConfig.s57CustomLayer.displayParameters.ECDISParameters.DynamicParameters.Parameter;
                parametersArray[MCSWidgetUtilities.findParameter(parametersArray, "LabelContours")].value = _this.LabelContoursCtrl.checked ? 2 : 1;
                this.MCSLayerConfig.s57CustomLayer.refresh();
            })));
        if (this["LabelSafetyContoursCtrl"])
            this.own(on(this.LabelSafetyContoursCtrl, 'change', lang.hitch(this, function () {
                var parametersArray = this.MCSLayerConfig.s57CustomLayer.displayParameters.ECDISParameters.DynamicParameters.Parameter;
                parametersArray[MCSWidgetUtilities.findParameter(parametersArray, "LabelSafetyContours")].value = _this.LabelSafetyContoursCtrl.checked ? 2 : 1;
                this.MCSLayerConfig.s57CustomLayer.refresh();
            })));
        if (this["OptionalDeepSoundingsCtrl"])
            this.own(on(this.OptionalDeepSoundingsCtrl, 'change', lang.hitch(this, function () {
                var parametersArray = this.MCSLayerConfig.s57CustomLayer.displayParameters.ECDISParameters.DynamicParameters.Parameter;
                parametersArray[MCSWidgetUtilities.findParameter(parametersArray, "OptionalDeepSoundings")].value = _this.OptionalDeepSoundingsCtrl.checked ? 2 : 1;
                this.MCSLayerConfig.s57CustomLayer.refresh();
            })));
        if (this["DisplayAIOFeaturesCtrl"] && query("input[type='checkbox']", _this.DisplayAIOFeaturesCtrl).length != 0)
            this.own(query("input[type='checkbox']", _this.DisplayAIOFeaturesCtrl).on('change', lang.hitch(this, function () {
                var parametersArray = this.MCSLayerConfig.s57CustomLayer.displayParameters.ECDISParameters.DynamicParameters.Parameter;
                var selectedFlags = "";
                query("input[type='checkbox']", _this.DisplayAIOFeaturesCtrl).forEach(function (checkbox) {
                    if (checkbox.checked) {
                        selectedFlags = selectedFlags + checkbox.value + ",";
                    }
                });
                if (selectedFlags.length > 1) selectedFlags = selectedFlags.substr(0, selectedFlags.length - 1); // remove the last comma
                parametersArray[MCSWidgetUtilities.findParameter(parametersArray, "DisplayAIOFeatures")].value = selectedFlags;
                this.MCSLayerConfig.s57CustomLayer.refresh();
            })));
        if (this["DisplayCategoryCtrl"] && query("input[type='checkbox']", _this.DisplayCategoryCtrl).length != 0)
            this.own(query("input[type='checkbox']", _this.DisplayCategoryCtrl).on('change', lang.hitch(this, function () {
                var parametersArray = this.MCSLayerConfig.s57CustomLayer.displayParameters.ECDISParameters.DynamicParameters.Parameter;
                var selectedvalues = 0;
                query("input[type='checkbox']", _this.DisplayCategoryCtrl).forEach(function (checkbox) {
                    if (checkbox.checked) {
                        selectedvalues += parseInt(checkbox.value);
                    }
                });
                var categories;
                switch (selectedvalues) {
                    case 1:
                        categories = "1";
                        break;
                    case 2:
                        categories = "2";
                        break;
                    case 3:
                        categories = "1,2";
                        break;
                    case 4:
                        categories = "4";
                        break;
                    case 5:
                        categories = "1,4";
                        break;
                    case 6:
                        categories = "2,4";
                        break;
                    case 7:
                        categories = "1,2,4";
                        break;
                    default:
                        categories = "";
                }
                parametersArray[MCSWidgetUtilities.findParameter(parametersArray, "DisplayCategory")].value = categories;
                this.MCSLayerConfig.s57CustomLayer.refresh();
            })));
        if (this["IntendedUsageCtrl"] && query("input[type='checkbox']", _this.IntendedUsageCtrl).length != 0)
            this.own(query("input[type='checkbox']", _this.IntendedUsageCtrl).on('change', lang.hitch(this, function () {
                var parametersArray = this.MCSLayerConfig.s57CustomLayer.displayParameters.ECDISParameters.DynamicParameters.Parameter;
                var selectedUsages = "";
                query("input[type='checkbox']", _this.IntendedUsageCtrl).forEach(function (checkbox) {
                    if (checkbox.checked) {
                        selectedUsages = selectedUsages + checkbox.value + ",";
                    }
                });
                if (selectedUsages.length > 1) selectedUsages = selectedUsages.substr(0, selectedUsages.length - 1); // remove the last comma
                if (selectedUsages.substr(0, 1) == "0") selectedUsages = "0"; // to handle special case for IntendedUsage
                parametersArray[MCSWidgetUtilities.findParameter(parametersArray, "IntendedUsage")].value = selectedUsages;
                this.MCSLayerConfig.s57CustomLayer.refresh();
            })));
        if (this["TextGroupsCtrl"] && query("input[type='checkbox']", _this.TextGroupsCtrl).length != 0)
            this.own(query("input[type='checkbox']", _this.TextGroupsCtrl).on('change', lang.hitch(this, function () {
                var grpParametersArray = this.MCSLayerConfig.s57CustomLayer.displayParameters.ECDISParameters.DynamicParameters.ParameterGroup;
                var parametersArray = grpParametersArray[MCSWidgetUtilities.findParameter(grpParametersArray, "TextGroups")].Parameter;
                query("input[type='checkbox']", _this.TextGroupsCtrl).forEach(function (checkbox) {
                    if (checkbox.checked) {
                        parametersArray[MCSWidgetUtilities.findParameter(parametersArray, checkbox.value)].value = 2;
                    }
                    else {
                        parametersArray[MCSWidgetUtilities.findParameter(parametersArray, checkbox.value)].value = 1;
                    }
                });
                this.MCSLayerConfig.s57CustomLayer.refresh();
            })));
    };

    MCSWidgetUtilities.findParameter = function(parametersArray, name) {
        for (i = 0; i < parametersArray.length; i++) {
         if (parametersArray[i].name == name) {
           return (i);
         }
       }
       return (-1);
     }
});