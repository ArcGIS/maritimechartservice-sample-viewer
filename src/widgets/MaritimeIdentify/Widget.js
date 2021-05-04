define(['dojo/_base/declare', 'jimu/BaseWidget', 'jimu/dijit/DrawBox', 'libs/mcs-widgets/Identify'],
    function(declare, BaseWidget, DrawBox, Identify) {
        //To create a widget, you need to derive from BaseWidget.
        var clazz = declare([BaseWidget], {

            // Custom widget code goes here
            baseClass: 'identify',
            s57ServiceUrl: null,
            // this property is set by the framework when widget is loaded.
            // name: 'Identify',
            // add additional properties here

            //methods to communication with app container:
            postCreate: function() {
                this.inherited(arguments);
                console.log('Identify::postCreate');

                // check if there is MCS layer on the map
                var flagHasMCSLayer = false;
                for (var j = 0; j < this.map.layerIds.length; j++) {
                    var layer = this.map.getLayer(this.map.layerIds[j]);
                    var indexMCSStr1 = layer.url.toLowerCase().indexOf("/exts/MaritimeChartService/MapServer".toLowerCase()); 
                    var indexMCSStr2 = layer.url.toLowerCase().indexOf("/exts/Maritime Chart Server/MapServer".toLowerCase());
                    var indexMCSStr3 = layer.url.toLowerCase().indexOf("/exts/Maritime%20Chart%20Service/MapServer".toLowerCase());
                    // in the MCS URL, "exts" and "mapserver" could be lower case or upper case
                    if ((indexMCSStr1 > 0 && layer.url.substring(indexMCSStr1+6, indexMCSStr1+26)=="MaritimeChartService")
                      || (indexMCSStr2 > 0 && layer.url.substring(indexMCSStr2+6, indexMCSStr2+27)=="Maritime Chart Server")
                      || (indexMCSStr3 > 0 && layer.url.substring(indexMCSStr3+6, indexMCSStr3+32)=="Maritime%20Chart%20Service")) {
                        flagHasMCSLayer = true;
                        break;
                    }
                }

                if (!flagHasMCSLayer) {
                    this.identifyNode.innerHTML = "This map has no Maritime Chart Service Layer";
                } else {
                    this.Identify = new Identify({
                        map: this.map
                    }, this.identifyNode);
                    this.Identify.setDrawBox(new DrawBox({
                        geoTypes: ['point', 'extent'],
                        deactivateAfterDrawing: false,
                        showClear: false
                    }));
                }
            },

            startup: function() {
                // summary:
                //      Overrides method of same name in dijit._Widget.
                // tags:
                //      private
                this.inherited(arguments);
                if (this.Identify) {
                    this.Identify.startup();
                }
            },


            onOpen: function() {
                // summary:
                //      Overrides method of same name in jimu._BaseWidget.
                console.log('Identify::onOpen', arguments);
            },

            onClose: function() {
                // summary:
                //      Overrides method of same name in jimu._BaseWidget.
                console.log('Identify::onClose', arguments);
            }

        });
        return clazz;

    });