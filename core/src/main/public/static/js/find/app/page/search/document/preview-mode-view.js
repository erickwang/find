define([
    'backbone',
    'underscore',
    'jquery',
    'i18n!find/nls/bundle',
    'i18n!find/nls/indexes',
    'find/app/vent',
    'find/app/util/view-server-client',
    'find/app/model/document-model',
    'find/app/configuration',
    'find/app/util/events',
    'text!find/templates/app/page/search/document/preview-mode-view.html',
    'text!find/templates/app/page/search/document/preview-mode-metadata.html',
    'text!find/templates/app/page/search/document/view-mode-document.html',
    'text!find/templates/app/page/search/document/view-media-player.html',
    'text!css/result-highlighting.css'
], function(Backbone, _, $, i18n, i18nIndexes, vent, viewClient, DocumentModel, configuration, events, template, metaDataTemplate, documentTemplate, mediaTemplate, highlightingRule) {
    'use strict';

    function scrollFollow() {
        // Check to see if the window has scrolled to the bottom, if it has dont move the preview down. (fix for BIFHI-197)
        var scrollPos = this.el.scrollHeight + this.$el.offset().top - $(window).height();

        if (scrollPos < -50 || scrollPos > 0) {
            if (this.$el.offsetParent().offset().top < 0) {
                this.$el.css('margin-top', Math.abs(+this.$el.offsetParent().offset().top) + 15);
            } else {
                this.$el.css('margin-top', 0);
            }

            if (this.$iframe) {
                this.$iframe.css('height', $(window).height() - this.$iframe.offset().top - 30 - this.$('.preview-mode-metadata').height());
            }
        }
    }

    function highlighting(innerWindow) {
        var styleEl = innerWindow.createElement('style');

        // Append style element to iframe document head
        innerWindow.head.appendChild(styleEl);

        styleEl.sheet.insertRule(highlightingRule, 0);
    }

    return Backbone.View.extend({
        template: _.template(template),
        metaDataTemplate: _.template(metaDataTemplate),
        documentTemplate: _.template(documentTemplate),
        mediaTemplate: _.template(mediaTemplate),

        events: {
            'click .preview-mode-open-detail-button': 'openDocumentDetail',
            'click .preview-mode-highlight-query-terms': 'toggleHighlighting',
            'click .close-preview-mode': 'triggerClose'
        },

        $iframe: null,

        initialize: function(options) {
            this.highlightingModel = new Backbone.Model({highlighting: false});

            var queryText = options.queryText;

            if (queryText !== '*') {
                this.queryText = queryText;
            }

            this.highlighting = this.queryText && configuration().viewHighlighting;
            
            this.scrollFollow = _.bind(scrollFollow, this);
        },

        triggerClose: function () {
            this.pauseMedia();
            this.trigger('close-preview');
        },

        render: function() {
            this.$el.html(this.template({
                i18n:i18n,
                mmapBaseUrl: configuration().mmapBaseUrl,
                mmapUrl: this.model.get('mmapUrl'),
                viewHighlighting: this.highlighting
            }));

            this.$highlightToggle = this.$('.preview-mode-highlight-query-terms');

            this.listenTo(this.highlightingModel, 'change:highlighting', _.bind(function() {
                this.$highlightToggle.toggleClass('active', this.highlightingModel.get('highlighting'));
            }, this));

            this.$('.preview-mode-document-title').text(this.model.get('title'));

            this.$('.preview-mode-metadata').html(this.metaDataTemplate({
                reference: i18n['search.document.reference'],
                index: i18nIndexes['search.document.index'],
                model: this.model
            }));

            var $preview = this.$('.preview-mode-document');

            if (this.model.isMedia()) {
                $preview.html(this.mediaTemplate({
                    i18n: i18n,
                    model: this.model
                }));
            } else {
                $preview.html(this.documentTemplate({
                    i18n: i18n
                }));

                this.$iframe = this.$('.preview-document-frame');

                this.$iframe.ajaxError(function() {
                    console.log('an error');
                });

                this.$iframe.on('load', _.bind(function() {
                    // Cannot execute scripts in iframe or detect error event, so look for attribute on html
                    if(this.$iframe.contents().find('html').data('hpeFindAuthError')) {
                        window.location.reload();
                    }

                    this.$('.view-server-loading-indicator').addClass('hidden');
                    this.$iframe.removeClass('hidden');
                    this.$iframe.css('height', $(window).height() - this.$iframe.offset().top - 30 - this.$('.preview-mode-metadata').height());

                    var $contents = this.$iframe.contents();

                    // View server adds script tags to rendered HTML documents, which are blocked by the application
                    // This replicates their functionality
                    $contents.find('.InvisibleAbsolute').hide();

                    var $contentDocument = $contents[0];

                    if(this.highlighting) {
                        highlighting($contentDocument);
                    }

                    this.$contentDocumentBody = $($contentDocument.body);

                    this.updateHighlighting();

                    this.listenTo(this.highlightingModel, 'change:highlighting', this.updateHighlighting);
                }, this));

                // The src attribute has to be added retrospectively to avoid a race condition
                var src = viewClient.getHref(this.model.get('reference'), this.model, this.highlighting ? this.queryText : null);
                this.$iframe.attr('src', src);
                this.$iframe.css('height', $(window).height() - $preview.offset().top - 30 - this.$('.preview-mode-metadata').height());
            }

            this.listenTo(this.model, 'remove destroy', this.triggerClose);

            _.defer(this.scrollFollow);

            $('.main-content').scroll(this.scrollFollow);
        },

        remove: function() {
            Backbone.View.prototype.remove.call(this);

            $('.main-content').off('scroll', this.scrollFollow);
        },

        pauseMedia: function () {
            if (this.model.get('media') === 'video' || this.model.get('media') === 'audio') {
                this.$('.preview-media-player').get(0).pause();
            }
        },

        openDocumentDetail: function () {
            this.pauseMedia();
            vent.navigateToDetailRoute(this.model);

            events().fullPreview()
        },

        toggleHighlighting: function() {
            this.highlightingModel.set('highlighting', !this.highlightingModel.get('highlighting'));
        },

        updateHighlighting: function() {
            this.$contentDocumentBody.toggleClass('haven-search-view-document-highlighting-on', this.highlightingModel.get('highlighting'));
        }
    });

});
