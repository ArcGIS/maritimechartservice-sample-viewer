define(['dojo/_base/declare', 'jimu/BaseWidget', 'libs/mcs-widgets/Search'],
    function (declare, BaseWidget, MaritimeSearch) {
        //To create a widget, you need to derive from BaseWidget.
        return declare([BaseWidget], {

            // Custom widget code goes here

            baseClass: 'maritime-search',
            // this property is set by the framework when widget is loaded.
            // name: 'MaritimeSearch',
            // add additional properties here

            //methods to communication with app container:
            postCreate: function () {
                this.inherited(arguments);
                console.log('MaritimeSearch::postCreate');

                this.s57Layers = [];
                for (var j = 0; j < this.map.layerIds.length; j++) {
                    var layer = this.map.getLayer(this.map.layerIds[j]);
                    var indexMCSStr1 = layer.url.toLowerCase().indexOf("/exts/MaritimeChartService/MapServer".toLowerCase()); 
                    var indexMCSStr2 = layer.url.toLowerCase().indexOf("/exts/Maritime Chart Server/MapServer".toLowerCase());
                    var indexMCSStr3 = layer.url.toLowerCase().indexOf("/exts/Maritime%20Chart%20Service/MapServer".toLowerCase());
                    // in the MCS URL, "exts" and "mapserver" could be lower case or upper case
                    if ((indexMCSStr1 > 0 && layer.url.substring(indexMCSStr1+6, indexMCSStr1+26)=="MaritimeChartService")
                      || (indexMCSStr2 > 0 && layer.url.substring(indexMCSStr2+6, indexMCSStr2+27)=="Maritime Chart Server")
                      || (indexMCSStr3 > 0 && layer.url.substring(indexMCSStr3+6, indexMCSStr3+32)=="Maritime%20Chart%20Service")) {
                        this.s57Layers.push(layer);
                      }
                }

                if (this.s57Layers.length == 0) {
                    this.maritimeSearchNode.innerHTML = "This map has no Maritime Chart Service Layer";

                } else {
                    this.maritimeSearch = new MaritimeSearch({
                        map: this.map,
                        s57Layers: this.s57Layers
                    }, this.maritimeSearchNode);
                }
            },

            startup: function () {

                this.inherited(arguments);

                console.log('MaritimeSearch::startup');
                if (this.maritimeSearch != null)
                    this.maritimeSearch.startup();
            }
        });

    });