package com.autonomy.abc.selenium.keywords;

import com.autonomy.abc.selenium.language.LanguageDropdown;
import com.autonomy.abc.selenium.language.IdolLanguageDropdown;
import org.openqa.selenium.By;
import org.openqa.selenium.WebDriver;

public class IdolCreateNewKeywordsPage extends CreateNewKeywordsPage {
    private IdolCreateNewKeywordsPage(WebDriver driver) {
        super(driver);
    }

    @Override
    protected LanguageDropdown languageDropdown() {
        return new IdolLanguageDropdown(findElement(By.cssSelector(".wizard-steps .language-select-view-container")), getDriver());
    }

    public static class Factory extends SOPageFactory<IdolCreateNewKeywordsPage> {
        public Factory() {
            super(IdolCreateNewKeywordsPage.class);
        }

        public IdolCreateNewKeywordsPage create(WebDriver context) {
            return new IdolCreateNewKeywordsPage(context);
        }
    }
}
