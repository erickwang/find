/*
 * Copyright 2015 Hewlett-Packard Development Company, L.P.
 * Licensed under the MIT License (the "License"); you may not use this file except in compliance with the License.
 */

define([
    'backbone',
    'find/app/model/find-base-collection'
], function(Backbone, FindBaseCollection) {

    return FindBaseCollection.extend({
        initialize: function (models, options) {
            this.url = options.url;
        }
    });

});