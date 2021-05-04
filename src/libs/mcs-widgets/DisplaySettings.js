//var testsUrl = window.location.pathname.substring(0, window.location.pathname.lastIndexOf('/')) + '/';

define([
  'dojo/on', 'dojo/topic', 'dojo/query', 'dojo/dom-style',
  'dojo/text!./templates/DisplaySettings.html',
  'dojo/_base/declare',
  'dojo/_base/lang',
  'dojo/_base/array',
  'dojo/Deferred',
  'dojo/dom',
  "dojo/dom-construct",
  "dojo/when",
  'dijit/_WidgetBase',
  'dijit/_TemplatedMixin',
  'dijit/_WidgetsInTemplateMixin',
  'dijit/form/CheckBox',
  'dijit/form/NumberSpinner',
  'dijit/form/DateTextBox',
  'esri/layers/ImageParameters',
  'esri/request',
  './S57ServiceLayer',
  './MiscTabContent',
  './ContourTabContent',
  './SymbolSizeTabContent',
  //testsUrl + '../S57ServiceLayer.js',
  //testsUrl + '../AISServiceLayer.js',
  'bootstrap/Tab',
  'dijit/form/Button'
], function(
  on, topic, query, domStyle,
  template,
  declare, lang, array, Deferred, dom, domConstruct, when,
  _WidgetBase,
  _TemplatedMixin,
  _WidgetsInTemplateMixin, 
  Checkbox,
  NumberSpinner,
  DateTextBox,
  ImageParameters,
  esriRequest,
  S57ServiceLayer,
  MiscTabContent,
  ContourTabContent,
  SymbolSizeTabContent
) {


  return declare([_WidgetBase, _TemplatedMixin, _WidgetsInTemplateMixin], {
    // description:
    //    Maritime

    templateString: template,
    baseClass: 'display-settings',
    widgetsInTemplate: true,
    map: null,
    includeParameters: null, /* set of parameters to include form config.json . This is different from selected control from Setting.js */
    includeParameterGroups: null,
    MCSLayersConfig: null,
    childWidgetInitialList: [],

    // Properties to be sent into constructor

    postCreate: function() {
      // summary:
      //    Overrides method of same name in dijit._Widget.
      // tags:
      //    private
      console.log('maritime.DisplaySettings::postCreate', arguments);

      this.setupConnections();
      this.inherited(arguments);

      var MCSLayerIDs = [];      
      var MCSLayerIndex = 0;
      for (var i = 0; i < this.map.layerIds.length; i++) {
        var layer = this.map.getLayer(this.map.layerIds[i]);
        var indexMCSStr1 = layer.url.toLowerCase().indexOf("/exts/MaritimeChartService/MapServer".toLowerCase()); 
        var indexMCSStr2 = layer.url.toLowerCase().indexOf("/exts/Maritime Chart Server/MapServer".toLowerCase());
        var indexMCSStr3 = layer.url.toLowerCase().indexOf("/exts/Maritime%20Chart%20Service/MapServer".toLowerCase());
        // in the MCS URL, "exts" and "mapserver" could be lower case or upper case
        if ((indexMCSStr1 > 0 && layer.url.substring(indexMCSStr1+6, indexMCSStr1+26)=="MaritimeChartService")
          || (indexMCSStr2 > 0 && layer.url.substring(indexMCSStr2+6, indexMCSStr2+27)=="Maritime Chart Server")
          || (indexMCSStr3 > 0 && layer.url.substring(indexMCSStr3+6, indexMCSStr3+32)=="Maritime%20Chart%20Service")) {
          MCSLayerIDs.push(layer.id);

          if(layer.isInstanceOf && layer.isInstanceOf(S57ServiceLayer))  // S57ServiceLayer is already initialized by identify . 
          {
            this.setupForS57ServiceLayerInstance(layer, i, MCSLayerIndex, true, true);
          }else{
            this.setupForNonS57ServiceLayerInstance(layer, i, MCSLayerIndex, true, true);
          }
          MCSLayerIndex = MCSLayerIndex + 1;
        }
      }
      for (key in this.MCSLayersConfig){
        if (MCSLayerIDs.indexOf(key) < 0){
          delete this.MCSLayersConfig[key];
        }
      }
      
    },

    // If the layer is a S57ServiceLayer instance, set the controls for the layer, add MCS layer to dropdown list if necessary
    // If this layer is not in this.MCSLayersConfig, add the layer to it  
    // layer: input layer
    // layerIndexOnMap: the index of the layer on the map
    // MCSLayerIndex: the index of the MCS layers among all the MCS layers
    // flagIsForPostCreate: true if it is for PostCreate, false if it is for Refresh
    // flagAddLayerToDropdown: true if the layer needs to be added to dropdown list, false if not
    setupForS57ServiceLayerInstance: function(layer, layerIndexOnMap, MCSLayerIndex, flagIsForPostCreate, flagAddLayerToDropdown) {
      if(!(layer.id in this.MCSLayersConfig)){
        this.MCSLayersConfig[layer.id] = {
          id: layer.id,
          controls: "",
          parametersContent: "",
          s57Layer: layer,
          s57LayerIndex: layerIndexOnMap,
          selected: ! MCSLayerIndex
        };
        this.MCSLayersConfig[layer.id].s57CustomLayer = layer;
        var deferred = this.getDefaultControls(layer.url, layer.id);
        when(deferred).then(lang.hitch(this, function() {
          if(flagIsForPostCreate){
            this.childWidgetInitialList = this.childWidgetInitialList.concat(this.setupMCSLayerControls(layer.id));
          }else{
            array.forEach(this.setupMCSLayerControls(layer.id), lang.hitch(this,function(childWidget) {
              childWidget.startup();
            }));
          }
          if (flagAddLayerToDropdown){
            this.addMCSLayerToDropdown(layer, MCSLayerIndex);
          }
        }));
      }else{
        this.MCSLayersConfig[layer.id].s57LayerIndex = layerIndexOnMap;
        this.MCSLayersConfig[layer.id].selected = ! MCSLayerIndex;
        if(flagIsForPostCreate){
          this.MCSLayersConfig[layer.id].s57CustomLayer = layer;
          this.childWidgetInitialList = this.childWidgetInitialList.concat(this.setupMCSLayerControls(layer.id));
        }
        if (flagAddLayerToDropdown){
          this.addMCSLayerToDropdown(layer, MCSLayerIndex);
        }
      }
    },

    // If the layer is not a S57ServiceLayer instance yet, create S57ServiceLayer instance from it, set the controls for the layer and add MCS layer to dropdown list if necessary
    // If this layer is not in this.MCSLayersConfig, add the layer to it 
    // layer: input layer
    // layerIndexOnMap: the index of the layer on the map
    // MCSLayerIndex: the index of the MCS layers among all the MCS layers
    // flagIsForPostCreate: true if it is for PostCreate, false if it is for Refresh
    // flagAddLayerToDropdown: true if the layer needs to be added to dropdown list, false if not
    setupForNonS57ServiceLayerInstance: function(layer, layerIndexOnMap, MCSLayerIndex, flagIsForPostCreate, flagAddLayerToDropdown) {
      var imageParameters = new ImageParameters();
      imageParameters.format = "jpeg";
      var deferred = null;
      if(!(layer.id in this.MCSLayersConfig)){
        this.MCSLayersConfig[layer.id] = {
          id: layer.id,
          controls: "",
          parametersContent: "",
          s57Layer: layer,
          s57LayerIndex: layerIndexOnMap,
          selected: ! MCSLayerIndex
        };
        deferred = this.getDefaultControls(layer.url, layer.id);
      }else{
        this.MCSLayersConfig[layer.id].s57LayerIndex = layerIndexOnMap;
        this.MCSLayersConfig[layer.id].selected = ! MCSLayerIndex;
      }

      this.MCSLayersConfig[layer.id].s57CustomLayer = new S57ServiceLayer(layer.url, {
        "opacity": layer.opacity,
        "visible": layer.visible,
        "imageParameters": imageParameters,
        "refreshInterval": layer.refreshInterval,
        "maxScale": layer.maxScale,
        "minScale": layer.minScale,
        "id": layer.id,
        "description": layer.description
      });
      this.MCSLayersConfig[layer.id].s57CustomLayer.title = this._getLayerTitle(layer);
      this.MCSLayersConfig[layer.id].s57CustomLayer.setVisibleLayers(layer.visibleLayers);
      on(this.MCSLayersConfig[layer.id].s57CustomLayer, 'parametersLoaded', lang.hitch(this, function (layer) {
        if (!(layer.id in this.MCSLayersConfig)){
          when(deferred).then(lang.hitch(this, function () {
            if (flagIsForPostCreate) {
              this.childWidgetInitialList = this.childWidgetInitialList.concat(this.setupMCSLayerControls(layer.id));
            } else {
              array.forEach(this.setupMCSLayerControls(layer.id), lang.hitch(this, function (childWidget) {
                childWidget.startup();
              }));
            }
            this.map.removeLayer(layer);              
            this.map.addLayer(this.MCSLayersConfig[layer.id].s57CustomLayer, this.MCSLayersConfig[layer.id].s57LayerIndex);
            if (flagAddLayerToDropdown){
              this.addMCSLayerToDropdown(this.MCSLayersConfig[layer.id].s57CustomLayer, MCSLayerIndex);          
            }
          }, layer));
        }else{
          this.childWidgetInitialList = this.childWidgetInitialList.concat(this.setupMCSLayerControls(layer.id));
          this.map.removeLayer(layer);              
          this.map.addLayer(this.MCSLayersConfig[layer.id].s57CustomLayer, this.MCSLayersConfig[layer.id].s57LayerIndex);
          if (flagAddLayerToDropdown){
            this.addMCSLayerToDropdown(this.MCSLayersConfig[layer.id].s57CustomLayer, MCSLayerIndex);          
          }
        }
      }, layer));
    },

    addMCSLayerToDropdown: function(layer, index) {
      var option = domConstruct.create("option", {
        id: "option_" + layer.id,
        value: layer.id,
        innerHTML: this._getLayerTitle(layer)
      }, this.MCSLayersSelectCtrl);
      // if index doesn't get passed to this function, don't set the option's index
      if (index >= 0){
        option.index = index;
      }
      if (index == 0){
        option.selected = true;
      }
    },

    _getLayerTitle: function(layer) {

      var operLayers = this.map.webMapResponse.itemInfo.itemData.operationalLayers;
      var title = null;
      for (var j = 0; j < operLayers.length; j++) {
        if ((layer) && !(layer.displayParameters) && (layer.id == operLayers[j].id)) {
          title = operLayers[j].title;
        }
      }
      if (title) {
        return title;
      }

      if(layer.title) {
        return layer.title;
      }

      if(lang.getObject("_wabProperties.originalLayerName", false, layer)) {
        return layer.name || layer.id;
      }

      title = layer.label || layer.name || "";
      if (layer.url) {
        var serviceName;
        var index = layer.url.indexOf("/FeatureServer");
        if (index === -1) {
          index = layer.url.indexOf("/MapServer");
        }
        if (index === -1) {
          index = layer.url.indexOf("/service");
        }
        if(index > -1) {
          serviceName = layer.url.substring(0, index);
          serviceName = serviceName.substring(serviceName.lastIndexOf("/") + 1, serviceName.length);
          if (title) {
            title = serviceName + " - " + title;
          } else {
            title = serviceName;
          }
        }

      }
      return title || layer.id;
    },

    setupMCSLayerControls: function(key) {
      var miscTabContentNode = domConstruct.create("div",
        { id: "miscTab_" + key }, this.misc_tab);
      var contourTabContentNode = domConstruct.create("div",
        { id: "contourTab_" + key }, this.contour_tab);
      var symbolSizeTabContentNode = domConstruct.create("div",
        { id: "symbolSizeTab_" + key }, this.symbol_size_tab);

      var miscTabContent = new MiscTabContent({
        MCSLayerConfig: this.MCSLayersConfig[key],
        includeParameters: this.includeParameters
      }, miscTabContentNode);

      var contourTabContent = new ContourTabContent({
        MCSLayerConfig: this.MCSLayersConfig[key],
        includeParameters: this.includeParameters
      }, contourTabContentNode);

      var symbolSizeTabContent = new SymbolSizeTabContent({
        MCSLayerConfig: this.MCSLayersConfig[key],
        includeParameters: this.includeParameters
      }, symbolSizeTabContentNode);

      return [miscTabContent, contourTabContent, symbolSizeTabContent];
    },

    setupConnections: function() {
      // summary:
      //    wire events, and such
      //
      console.log('maritime.DisplaySettings::setupConnections', arguments);

    },

    startup: function () {

      this.inherited(arguments);

      console.log('DisplaySettings::startup');
      var ti = setInterval(lang.hitch(this, function(){
        if (this.childWidgetInitialList.length == Object.keys(this.MCSLayersConfig).length * 3){
          for (var i = 0; i < this.childWidgetInitialList.length; i++){
            this.childWidgetInitialList[i].startup();
          }
          clearInterval(ti);
        }
      }), 100);
    },

    _onSelectedLayerChange: function(e) {
      var selectedLayerId = e.target.options[e.target.selectedIndex].value;
      for (var key in this.MCSLayersConfig) {
        if (key == selectedLayerId){
          this.MCSLayersConfig[key].selected = true;
          dom.byId("miscTab_" + key).style.display = "block";
          dom.byId("contourTab_" + key).style.display = "block";
          dom.byId("symbolSizeTab_" + key).style.display = "block";
        }
        else{
          this.MCSLayersConfig[key].selected = false;
          dom.byId("miscTab_" + key).style.display = "none";
          dom.byId("contourTab_" + key).style.display = "none";
          dom.byId("symbolSizeTab_" + key).style.display = "none";
        }
      }
    },

    _onDisplaySettingRefreshClick: function() {
      var MCSLayerIDs = [];
      var MCSLayerIndex = 0;
      // not display MCS layer setting div
      query("[id^='miscTab_']", this.misc_tab).forEach(function(miscTabDiv) {
        if(miscTabDiv.style.display != "none") {
          miscTabDiv.style.display == "none";
        }
      });
      query("[id^='contourTab_']", this.contour_tab).forEach(function(contourTabDiv) {
        if(contourTabDiv.style.display != "none") {
          contourTabDiv.style.display == "none";
        }
      });
      query("[id^='symbolSizeTab_']", this.symbol_size_tab).forEach(function(symbolSizeTabDiv) {
        if(symbolSizeTabDiv.style.display != "none") {
          symbolSizeTabDiv.style.display == "none";
        }
      });

      for (var i = 0; i < this.map.layerIds.length; i++){
        var layer = this.map.getLayer(this.map.layerIds[i]);
        var indexMCSStr1 = layer.url.toLowerCase().indexOf("/exts/MaritimeChartService/MapServer".toLowerCase()); 
        var indexMCSStr2 = layer.url.toLowerCase().indexOf("/exts/Maritime Chart Server/MapServer".toLowerCase());
        var indexMCSStr3 = layer.url.toLowerCase().indexOf("/exts/Maritime%20Chart%20Service/MapServer".toLowerCase());
        // in the MCS URL, "exts" and "mapserver" could be lower case or upper case
        if ((indexMCSStr1 > 0 && layer.url.substring(indexMCSStr1+6, indexMCSStr1+26)=="MaritimeChartService")
          || (indexMCSStr2 > 0 && layer.url.substring(indexMCSStr2+6, indexMCSStr2+27)=="Maritime Chart Server")
          || (indexMCSStr3 > 0 && layer.url.substring(indexMCSStr3+6, indexMCSStr3+32)=="Maritime%20Chart%20Service")) {
          MCSLayerIDs.push(layer.id);

          if (!(layer.id in this.MCSLayersConfig)) {
            if(layer.isInstanceOf && layer.isInstanceOf(S57ServiceLayer)) {
              this.setupForS57ServiceLayerInstance(layer, i, MCSLayerIndex, false, true);
            }else{
              this.setupForNonS57ServiceLayerInstance(layer, i, MCSLayerIndex, false, true);
            }
          }
          else{
            // update s57LayerIndex since the order of layers in the map could get changed
            this.setupForS57ServiceLayerInstance(layer, i, MCSLayerIndex, false, false);
            var option = query("#option_" + layer.id, this.MCSLayersSelectCtrl);
            option.index = MCSLayerIndex;
            option.selected = ! MCSLayerIndex;
            if (!MCSLayerIndex){
              query("#miscTab_" + layer.id, this.misc_tab).style.display = "block";
              query("#contourTab_" + layer.id, this.contour_tab).style.display = "block";
              query("#symbolSizeTab" + layer.id, this.symbol_size_tab).style.display = "block";
            }
          }
          MCSLayerIndex = MCSLayerIndex + 1;
        }
      }
      if (MCSLayerIDs.length == 0){
        dom.byId("displaySettingsNode").innerHTML = "This map has no Maritime Chart Service Layer";
      }
      for (key in this.MCSLayersConfig){
        if (MCSLayerIDs.indexOf(key) < 0){
          // remove the layer from dropdown list
          this.MCSLayersSelectCtrl.removeChild(query("#option_" + key, this.MCSLayersSelectCtrl)[0]);
          // remove the miscTab contourTab, symbolSizeTab contents for the layer
          this.misc_tab.removeChild(query("#miscTab_" + key, this.misc_tab)[0]);
          this.contour_tab.removeChild(query("#contourTab_" + key, this.contour_tab)[0]);
          this.symbol_size_tab.removeChild(query("#symbolSizeTab_" + key, this.symbol_size_tab)[0]);
          delete this.MCSLayersConfig[key];
        }
      }
    },

    getDefaultControls: function(layerURL, layerID) {
      if (layerURL.endsWith("/"))
        layerURLwithParams = layerURL + "parameters?f=json&full=true";
      else
        layerURLwithParams = layerURL + "/parameters?f=json&full=true";
      var requestHandle = esriRequest({
        "url": layerURLwithParams
      });
      var deferredReturn = new Deferred();
      deferredReturn = requestHandle.then(lang.hitch(this, function(response,io) {
        this.MCSLayersConfig[layerID].parametersContent = JSON.stringify(response.DisplayParameters);

        var parameters, parameter;
        var controls = "";
        if (response.DisplayParameters && response.DisplayParameters.ECDISParameters && response.DisplayParameters.ECDISParameters.StaticParameters) {
          parameters = response.DisplayParameters.ECDISParameters.StaticParameters.Parameter;
          for (var i = 0; i< parameters.length; i++) {
            parameter = parameters[i];
            if(this.includeParameters[parameter.name]) {
              controls += parameter.name + ",";
            }
          }
        }
        if (response.DisplayParameters && response.DisplayParameters.ECDISParameters && response.DisplayParameters.ECDISParameters.DynamicParameters) {
          parameters = response.DisplayParameters.ECDISParameters.DynamicParameters.Parameter;
          for (var i = 0; i< parameters.length; i++) {
            parameter = parameters[i];
            if(this.includeParameters[parameter.name]) {
              // we need bypass the three text boxes here
              if (parameter.name != 'DeepContour' && parameter.name != 'SafetyContour' && parameter.name != 'SafetyDepth' && parameter.name != 'ShallowContour') {
                controls += parameter.name + ",";
              }
            }
          }
        }
        if (response.DisplayParameters && response.DisplayParameters.ECDISParameters && response.DisplayParameters.ECDISParameters.DynamicParameters) {
          parameterGroups = response.DisplayParameters.ECDISParameters.DynamicParameters.ParameterGroup;
          for (var i =0; i < parameterGroups.length; i++) {
            paramGroup = parameterGroups[i];
            if(this.includeParameterGroups[paramGroup.name]) {
              controls += paramGroup.name + ",";
           }
          }
        }
        this.MCSLayersConfig[layerID].controls = controls;

      }), lang.hitch(this, function(error, io) {
        console.log('Getting default display settings controls', error);
      }));
      return deferredReturn;
    }
  });
});
