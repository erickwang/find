/*
 * Copyright 2015-2017 Hewlett Packard Enterprise Development Company, L.P.
 * Licensed under the MIT License (the "License"); you may not use this file except in compliance with the License.
 */

package com.hp.autonomy.frontend.find.core.customization.templates;

import java.io.IOException;

@SuppressWarnings("InterfaceMayBeAnnotatedFunctional")
public interface TemplatesService {

    Templates getTemplates();

    void loadTemplates() throws IOException, TemplateNotFoundException;

}
