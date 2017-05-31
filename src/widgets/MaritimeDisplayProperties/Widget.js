define(['dojo/_base/declare', 'jimu/BaseWidget', 'libs/mcs-widgets/DisplaySettings'],
    function(declare, BaseWidget, DisplaySettings) {
        //To create a widget, you need to derive from BaseWidget.
        return declare([BaseWidget], {

            // Custom widget code goes here

            baseClass: 'mcs-display-properties',
            // this property is set by the framework when widget is loaded.
            // name: 'MCSDisplayProperties',
            // add additional properties here

            //methods to communication with app container:
            postCreate: function() {
                this.inherited(arguments);
                console.log('MaritimeDisplayProperties::postCreate');

                for (var j = 0; j < this.map.layerIds.length; j++) {
                    var layer = this.map.getLayer(this.map.layerIds[j]);
                    /* This AIS Service code is for Esri demo purposes only and does not impact your deployment of this widget. This widget does not depend on an AIS Service being available. */
                    if ((layer.url.indexOf("/exts/MaritimeChartService/AISServer") > 0) || (layer.url.indexOf("/exts/Maritime Chart Server/AISServer") > 0))
                        this.aisLayer = layer;
                    else if ((layer.url.indexOf("/exts/MaritimeChartService/MapServer") > 0) || (layer.url.indexOf("/exts/Maritime Chart Server/MapServer") > 0))
                        this.s57Layer = layer;
                }

                var operLayers = this.map.webMapResponse.itemInfo.itemData.operationalLayers;
                for (j = 0; j < operLayers.length; j++) {
                    if((this.s57Layer) && (this.s57Layer.id == operLayers[j].id)) {
                        this.s57LayerTitle = operLayers[j].title;
                    } else if((this.aisLayer) && (this.aisLayer.id == operLayers[j].id)) {
                        this.aisLayerTitle = operLayers[j].title;
                    }
                    /* This AIS Service code is for Esri demo purposes only and does not impact your deployment of this widget. This widget does not depend on an AIS Service being available. */

                }

                if (this.s57Layer == null) {
                    this.displaySettingsNode.innerHTML = "This map has no Maritime Chart Service Layer";

                } else {
                    this.displaySettings = new DisplaySettings({
                        map: this.map,
                        s57Layer: this.s57Layer,
                        /* This AIS Service code is for Esri demo purposes only and does not impact your deployment of this widget. This widget does not depend on an AIS Service being available. */
                        aisLayer: this.aisLayer,
                        s57LayerTitle: this.s57LayerTitle,
                        /* This AIS Service code is for Esri demo purposes only and does not impact your deployment of this widget. This widget does not depend on an AIS Service being available. */
                        aisLayerTitle: this.aisLayerTitle
                    }, this.displaySettingsNode);
                }

            },

            startup: function() {

               this.inherited(arguments);

               console.log('MCSDisplayProperties::startup');
               if (this.displaySettings != null)
                this.displaySettings.startup();
            }

            // onOpen: function(){
            //   console.log('MCSDisplayProperties::onOpen');
            // },

            // onClose: function(){
            //   console.log('MCSDisplayProperties::onClose');
            // },

            // onMinimize: function(){
            //   console.log('MCSDisplayProperties::onMinimize');
            // },

            // onMaximize: function(){
            //   console.log('MCSDisplayProperties::onMaximize');
            // },

            // onSignIn: function(credential){
            //   console.log('MCSDisplayProperties::onSignIn', credential);
            // },

            // onSignOut: function(){
            //   console.log('MCSDisplayProperties::onSignOut');
            // }

            // onPositionChange: function(){
            //   console.log('MCSDisplayProperties::onPositionChange');
            // },

            // resize: function(){
            //   console.log('MCSDisplayProperties::resize');
            // }

            //methods to communication between widgets:

        });

    });