package com.autonomy.abc.selenium.devconsole;

import com.hp.autonomy.frontend.selenium.application.ElementFactoryBase;
import com.hp.autonomy.frontend.selenium.application.LoginService;
import com.hp.autonomy.frontend.selenium.application.PageMapper;
import com.hp.autonomy.frontend.selenium.login.LoginPage;
import com.hp.autonomy.frontend.selenium.sso.HSOLoginPage;
import com.hp.autonomy.frontend.selenium.util.AppPage;
import com.hp.autonomy.frontend.selenium.util.ParametrizedFactory;
import org.openqa.selenium.WebDriver;

public class DevConsoleElementFactory extends ElementFactoryBase {
    public DevConsoleElementFactory(WebDriver driver) {
        super(driver, new PageMapper<>(Page.class));
    }

    @Override
    public LoginPage getLoginPage(){
        return loadPage(LoginPage.class);
    }

    @Override
    public LoginService.LogoutHandler getLogoutHandler() {
        return getTopNavBar();
    }

    public DevConsoleTopNavBar getTopNavBar() {
        return new DevConsoleTopNavBar(getDriver());
    }

    public HSODLandingPage getHSODPage() {
        return loadPage(HSODLandingPage.class);
    }

    public DevConsoleHomePage getHomePage() {
        return loadPage(DevConsoleHomePage.class);
    }

    private enum Page implements PageMapper.Page {
        LOGIN(new ParametrizedFactory<WebDriver, HSOLoginPage>() {
            @Override
            public HSOLoginPage create(WebDriver context) {
                return new HSOLoginPage(context, new DevConsoleHasLoggedIn(context));
            }
        }, HSOLoginPage.class),
        HOME(new DevConsoleHomePage.Factory(), DevConsoleHomePage.class),
        SEARCH(new HSODLandingPage.Factory(), HSODLandingPage.class);

        private final Class<? extends AppPage> pageType;
        private ParametrizedFactory<WebDriver, ? extends AppPage> factory;

        <T extends AppPage> Page(ParametrizedFactory<WebDriver, ? extends T> factory, Class<T> type) {
            pageType = type;
            this.factory = factory;
        }

        @Override
        public Class<?> getPageType() {
            return pageType;
        }

        public Object loadAsObject(WebDriver driver) {
            return this.factory.create(driver);
        }
    }
}
