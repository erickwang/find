define([
    'leaflet', 'leaflet.draw'
], function(L, leafletDraw){

    L.drawLocal.edit.toolbar.buttons.negate = 'Negate';
    L.drawLocal.edit.handlers.negate = {
        tooltip: {
            text: 'Click on a shape to negate'
        }
    }

    L.Draw.Event.NEGATESTART = 'draw:negatestart';
    L.Draw.Event.NEGATESTOP = 'draw:negatestop';

    /**
     * @class L.EditToolbar.Negate
     * @aka EditToolbar.Delete
     */
    L.EditToolbar.Negate = L.Handler.extend({
        statics: {
            TYPE: 'negate'
        },

        includes: L.Mixin.Events,

        // @method intialize(): void
        initialize: function (map, options) {
            L.Handler.prototype.initialize.call(this, map);

            L.Util.setOptions(this, options);

            // Store the selectable layer group for ease of access
            this._negatableLayers = this.options.featureGroup;

            if (!(this._negatableLayers instanceof L.FeatureGroup)) {
                throw new Error('options.featureGroup must be a L.FeatureGroup');
            }

            // Save the type so super can fire, need to do this as cannot do this.TYPE :(
            this.type = L.EditToolbar.Negate.TYPE;
        },

        // @method enable(): void
        // Enable the negate toolbar
        enable: function () {
            if (this._enabled || !this._hasAvailableLayers()) {
                return;
            }
            this.fire('enabled', { handler: this.type });

            this._map.fire(L.Draw.Event.NEGATESTART, { handler: this.type });

            L.Handler.prototype.enable.call(this);

            this._negatableLayers
                .on('layeradd', this._enableLayerNegate, this)
                .on('layerremove', this._disableLayerNegate, this);
        },

        // @method disable(): void
        // Disable the delete toolbar
        disable: function () {
            if (!this._enabled) {
                return;
            }

            this._negatableLayers
                .off('layeradd', this._enableLayerNegate, this)
                .off('layerremove', this._disableLayerNegate, this);

            L.Handler.prototype.disable.call(this);

            this._map.fire(L.Draw.Event.NEGATESTOP, { handler: this.type });

            this.fire('disabled', { handler: this.type });
        },

        // @method addHooks(): void
        // Add listener hooks to this handler
        addHooks: function () {
            var map = this._map;

            if (map) {
                map.getContainer().focus();

                this._negatableLayers.eachLayer(this._enableLayerNegate, this);
                this._negatedLayers = new L.LayerGroup();

                this._tooltip = new L.Draw.Tooltip(this._map);
                this._tooltip.updateContent({ text: L.drawLocal.edit.handlers.negate.tooltip.text });

                this._map.on('mousemove', this._onMouseMove, this);
            }
        },

        // @method removeHooks(): void
        // Remove listener hooks from this handler
        removeHooks: function () {
            if (this._map) {
                this._negatableLayers.eachLayer(this._disableLayerNegate, this);
                this._negatedLayers = null;

                this._tooltip.dispose();
                this._tooltip = null;

                this._map.off('mousemove', this._onMouseMove, this);
            }
        },

        // @method revertLayers(): void
        // Revert the negated layers back to their prior state.
        revertLayers: function () {
            // Iterate of the negated layers and add them back into the featureGroup
            this._negatedLayers.eachLayer(function (layer) {
                this._negatableLayers.addLayer(layer);
                layer.fire('revert-negated', { layer: layer });
            }, this);
        },

        // @method save(): void
        // Save negated layers
        save: function () {
            this._map.fire(L.Draw.Event.NEGATED, { layers: this._negatedLayers });
        },

        _enableLayerNegate: function (e) {
            var layer = e.layer || e.target || e;

            layer.on('click', this._removeLayer, this);
        },

        _disableLayerNegate: function (e) {
            var layer = e.layer || e.target || e;

            layer.off('click', this._removeLayer, this);

            // Remove from the negated layers so we can't accidentally revert if the user presses cancel
            this._negatedLayers.removeLayer(layer);
        },

        _removeLayer: function (e) {
            var layer = e.layer || e.target || e;

            this._negatableLayers.removeLayer(layer);

            this._negatedLayers.addLayer(layer);

            layer.fire('negated');
        },

        _onMouseMove: function (e) {
            this._tooltip.updatePosition(e.latlng);
        },

        _hasAvailableLayers: function () {
            return this._negatableLayers.getLayers().length !== 0;
        }
    });
    
    L.EditToolbar.prototype.options.negate = {};

    const origFn = L.EditToolbar.prototype.getModeHandlers;
    L.EditToolbar.prototype.getModeHandlers = function(map){
        const handlers = origFn.apply(this, arguments);

        const featureGroup = this.options.featureGroup;

        handlers.push({
            enabled: this.options.negate,
            handler: new L.EditToolbar.Negate(map, {
                featureGroup: featureGroup
            }),
            title: L.drawLocal.edit.toolbar.buttons.negate
        });

        return handlers;
    }

    return leafletDraw;
})