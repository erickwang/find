define([
    'backbone',
    'underscore',
    'i18n!find/nls/bundle',
    'text!find/templates/app/page/search/results/topic-map-view.html',
    'topicmap/js/topicmap',
    'iCheck',
    'slider/bootstrap-slider'
], function(Backbone, _, i18n, template) {

    'use strict';

    var clusteringModes = [
        {value: 'occurrences', text: i18n['search.topicMap.occurrences']},
        {value: 'docsWithPhrase', text: i18n['search.topicMap.documents']}
    ];

    return Backbone.View.extend({
        template: _.template(template),
        topicCount: 10,
        clusteringMode: clusteringModes[0].value,

        initialize: function(options) {
            this.entityCollection = options.entityCollection;
            this.clickHandler = options.clickHandler;

            this.relevance = {
                min: 0,
                max: 0,
                value: 0
            };
        },

        update: function() {
            this.$topicMap.topicmap('renderData', {
                name: 'topic map',
                size: 1.0,
                sentiment: null,
                children: this.entityCollection.chain()
                    .filter(function(entity) {
                        return entity.get(this.clusteringMode) >= this.relevance.value;
                    }, this)
                    .first(this.topicCount)
                    .map(function(entity) {
                        return {
                            name: entity.get('text'),
                            size: entity.get(this.clusteringMode),
                            sentiment: null,
                            children: null
                        };
                    }, this)
                    .value()
            }, false);
        },

        renderRelevanceSlider: function() {
            if (!this.entityCollection.isEmpty()) {
                this.relevance.min = _.min(this.entityCollection.models, function(model) {
                    return model.get(this.clusteringMode);
                }, this).get(this.clusteringMode);

                this.relevance.max = _.max(this.entityCollection.models, function(model) {
                    return model.get(this.clusteringMode);
                }, this).get(this.clusteringMode);

                this.relevance.value = this.relevance.min;
                this.renderAmountSlider();
                this.$relevanceSlider.slider(this.relevance);
                this.$relevanceSlider.slider('refresh');
            }
        },

        renderAmountSlider: function() {
            var max = this.entityCollection.filter(function(entity) {
                return entity.get(this.clusteringMode) >= this.relevance.value;
            }, this).length;

            this.$amountSlider.slider({
                min: 1,
                max: max,
                value: Math.min(this.topicCount, max)
            });

            this.$amountSlider.slider('refresh');
        },

        render: function() {
            this.$el.html(this.template({
                i18n: i18n,
                clusteringModes: clusteringModes,
                selectedMode: this.clusteringMode,
                radioName: _.uniqueId('topic-map-radio')
            }));

            this.$topicMap = this.$('.topic-map');

            this.$topicMap.topicmap({
                hideLegend: false,
                skipAnimation: false,
                onLeafClick: _.bind(function(node) {
                    this.clickHandler(node.name);
                }, this)
            });

            var $iCheck = this.$el.find('.i-check');

            $iCheck.iCheck({
                radioClass: 'iradio-hp'
            });

            this.$amountSlider = this.$el.find('.amount-slider');
            this.$relevanceSlider = this.$el.find('.relevance-slider');

            this.update();
            this.renderRelevanceSlider();

            this.$amountSlider.on('change', _.bind(function(event) {
                this.topicCount = event.value.newValue;
                this.update();
            }, this));

            this.$relevanceSlider.on('change', _.bind(function(event) {
                this.relevance.value = event.value.newValue;
                this.update();
                this.renderAmountSlider();
            }, this));

            $iCheck.on('ifChecked', _.bind(function(event) {
                this.clusteringMode = event.target.value;
                this.renderRelevanceSlider();
                this.update();
            }, this));

            this.listenTo(this.entityCollection, 'reset', function() {
                this.renderRelevanceSlider();
                this.update();
            });
        }
    });
});


