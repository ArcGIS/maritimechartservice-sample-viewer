define(['dojo/_base/declare', 'jimu/BaseWidget', 'libs/mcs-widgets/Search'],
    function(declare, BaseWidget, MaritimeSearch) {
        //To create a widget, you need to derive from BaseWidget.
        return declare([BaseWidget], {

            // Custom widget code goes here

            baseClass: 'maritime-search',
            // this property is set by the framework when widget is loaded.
            // name: 'MaritimeSearch',
            // add additional properties here

            //methods to communication with app container:
            postCreate: function() {
                this.inherited(arguments);
                console.log('MaritimeSearch::postCreate');

                for (var j = 0; j < this.map.layerIds.length; j++) {
                    var layer = this.map.getLayer(this.map.layerIds[j]);
                    if ((layer.url.indexOf("/exts/MaritimeChartService/MapServer") > 0) || (layer.url.indexOf("/exts/Maritime Chart Server/MapServer") > 0))
                        this.s57Layer = layer;
                }

                var operLayers = this.map.webMapResponse.itemInfo.itemData.operationalLayers;
                for (j = 0; j < operLayers.length; j++) {
                    if ((this.s57Layer) && (this.s57Layer.id == operLayers[j].id)) {
                        this.s57LayerTitle = operLayers[j].title;
                    } 

                }

                if (this.s57Layer == null) {
                    this.maritimeSearchNode.innerHTML = "This map has no S-57 Maritime Chart Service Layer";

                } else {
                    this.maritimeSearch = new MaritimeSearch({
                        map: this.map,
                        s57Layer: this.s57Layer,
                    }, this.maritimeSearchNode);
                }

            },

            startup: function() {

                    this.inherited(arguments);

                    console.log('MaritimeSearch::startup');
                    if (this.maritimeSearch != null)
                        this.maritimeSearch.startup();
                }

            // onOpen: function(){
            //   console.log('MaritimeSearch::onOpen');
            // },

            // onClose: function(){
            //   console.log('MaritimeSearch::onClose');
            // },

            // onMinimize: function(){
            //   console.log('MaritimeSearch::onMinimize');
            // },

            // onMaximize: function(){
            //   console.log('MaritimeSearch::onMaximize');
            // },

            // onSignIn: function(credential){
            //   console.log('MaritimeSearch::onSignIn', credential);
            // },

            // onSignOut: function(){
            //   console.log('MaritimeSearch::onSignOut');
            // }

            // onPositionChange: function(){
            //   console.log('MaritimeSearch::onPositionChange');
            // },

            // resize: function(){
            //   console.log('MaritimeSearch::resize');
            // }

            //methods to communication between widgets:

        });

    });