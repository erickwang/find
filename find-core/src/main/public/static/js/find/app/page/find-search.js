/*
 * Copyright 2014-2015 Hewlett-Packard Development Company, L.P.
 * Licensed under the MIT License (the "License"); you may not use this file except in compliance with the License.
 */

define([
    'js-whatever/js/base-page',
    'find/app/model/query-model',
    'find/app/page/search/input-view',
    'find/app/page/search/service-view',
    'find/app/page/search/saved-searches/saved-searches-tabs-view',
    'find/app/model/saved-searches/saved-search-collection',
    'js-whatever/js/list-view',
    'find/app/router',
    'find/app/vent',
    'underscore',
    'text!find/templates/app/page/find-search.html'
], function(BasePage, QueryModel, InputView, ServiceView, SavedSearchesTabsView, SavedSearchCollection, ListView, router, vent, _, template) {

    var reducedClasses = 'reverse-animated-container col-sm-offset-1 col-md-offset-2 col-lg-offset-3 col-xs-12 col-sm-10 col-md-8 col-lg-6';
    var expandedClasses = 'animated-container col-sm-offset-1 col-md-offset-2 col-xs-12 col-sm-10 col-md-7';

    return BasePage.extend({
        className: 'search-page',
        template: _.template(template),

        // Overridden
        ServiceView: ServiceView,

        initialize: function() {
            this.queryModel = new QueryModel();
            this.listenTo(this.queryModel, 'change:queryText', this.expandedState);

            this.savedSearchCollection = new SavedSearchCollection();
            this.savedSearchCollection.fetch();

            this.inputView = new InputView({
                queryModel: this.queryModel
            });

            this.savedSearchesTabsView = new SavedSearchesTabsView({
                savedSearchesCollection: this.savedSearchCollection
            });

            this.listView = new ListView({
                ItemView: this.ServiceView,
                collection: this.collection,
                itemOptions: {
                    tagName: 'li' //TODO: change tag name and template
                }
            });

            router.on('route:search', function(text) {
                if (text) {
                    this.queryModel.set('queryText', text);
                } else {
                    this.queryModel.set('queryText', '');
                }
            }, this);
        },

        render: function() {
            this.$el.html(this.template);

            this.inputView.setElement(this.$('.input-view-container')).render();
            this.savedSearchesTabsView.setElement(this.$('.saved-searches-tabs-view-container')).render();
            this.listView.setElement(this.savedSearchesTabsView.$('.saved-searches-list')).render();

            this.reducedState();
        },

        expandedState: function() {
            /*fancy animation*/
            this.$('.find').removeClass(reducedClasses).addClass(expandedClasses);

            this.$('.saved-searches-tabs-view-container').show();
            this.$('.app-logo').hide();
            this.$('.hp-logo-footer').addClass('hidden');

            // TODO: somebody else needs to own this
            $('.find-navbar').removeClass('reduced').find('>').show();
            $('.container-fluid').removeClass('reduced');

            vent.navigate('find/search/' + encodeURIComponent(this.queryModel.get('queryText')), {trigger: false});
        },

        reducedState: function() {
            /*fancy reverse animation*/
            this.$('.find').removeClass(expandedClasses).addClass(reducedClasses);

            this.$('.saved-searches-tabs-view-container').hide();
            this.$('.app-logo').show();
            this.$('.hp-logo-footer').removeClass('hidden');

            // TODO: somebody else needs to own this
            $('.find-navbar').addClass('reduced').find('>').hide();
            $('.container-fluid').addClass('reduced');

            vent.navigate('find/search', {trigger: false});
        }
    });
});
