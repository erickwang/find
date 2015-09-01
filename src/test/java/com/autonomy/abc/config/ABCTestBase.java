package com.autonomy.abc.config;

import com.autonomy.abc.framework.*;
import com.autonomy.abc.selenium.config.Timeouts;
import com.autonomy.abc.selenium.menubar.SideNavBar;
import com.autonomy.abc.selenium.menubar.TopNavBar;
import com.autonomy.abc.selenium.page.AppBody;
import com.autonomy.abc.selenium.page.login.ApiKey;
import com.autonomy.abc.selenium.page.login.LoginHostedPage;
import com.autonomy.abc.selenium.util.ImplicitWaits;
import org.junit.*;
import org.junit.rules.RuleChain;
import org.junit.runner.RunWith;
import org.junit.runners.Parameterized;
import org.junit.runners.model.MultipleFailureException;
import org.openqa.selenium.By;
import org.openqa.selenium.Platform;
import org.openqa.selenium.TimeoutException;
import org.openqa.selenium.WebDriver;
import org.openqa.selenium.support.ui.ExpectedConditions;
import org.openqa.selenium.support.ui.WebDriverWait;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import java.net.MalformedURLException;
import java.util.*;

import static org.junit.Assert.fail;


@Ignore
@RunWith(Parameterized.class)
public abstract class ABCTestBase {
	private static final Logger LOGGER = LoggerFactory.getLogger(ABCTestBase.class);
	private final static Set<String> USER_BROWSERS;
	private final static Set<ApplicationType> APPLICATION_TYPES;
	private final TestState testState = TestState.get();

	public final TestConfig config;
	public final String browser;
	private final Platform platform;
	private final ApplicationType type;
	private WebDriver driver;
	public AppBody body;
	protected SideNavBar navBar;
	protected TopNavBar topNavBar;
	private String loginName;

	static {
		final String[] allBrowsers = {"firefox", "internet explorer", "chrome"};
		final String browserProperty = System.getProperty("com.autonomy.browsers");
		final String applicationTypeProperty = System.getProperty("com.autonomy.applicationType");

		if (browserProperty == null) {
			USER_BROWSERS = new HashSet<>(Arrays.asList(allBrowsers));
		} else {
			USER_BROWSERS = new HashSet<>();

			for (final String browser : allBrowsers) {
				if (browserProperty.contains(browser)) {
					USER_BROWSERS.add(browser);
				}
			}
		}

		if (applicationTypeProperty == null) {
			APPLICATION_TYPES = EnumSet.allOf(ApplicationType.class);
		} else {
			APPLICATION_TYPES = EnumSet.noneOf(ApplicationType.class);

			for (final ApplicationType applicationType : ApplicationType.values()) {
				if (applicationTypeProperty.contains(applicationType.getName())) {
					APPLICATION_TYPES.add(applicationType);
				}
			}
		}
	}

	public ABCTestBase(final TestConfig config, final String browser, final ApplicationType type, final Platform platform) {
		this.config = config;
		this.browser = browser;
		this.platform = platform;
		this.type = type;
	}

	@Parameterized.Parameters
	public static Iterable<Object[]> parameters() throws MalformedURLException {
		final Collection<ApplicationType> applicationType = Arrays.asList(ApplicationType.HOSTED, ApplicationType.ON_PREM);
		return parameters(applicationType);
	}

	protected static List<Object[]> parameters(final Iterable<ApplicationType> applicationTypes) throws MalformedURLException {
		final List<Object[]> output = new ArrayList<>();

		for (final ApplicationType type : applicationTypes) {
			if (APPLICATION_TYPES.contains(type)) {
				for (final String browser : USER_BROWSERS) {
					output.add(new Object[]{
							new TestConfig(output.size(), type),
							browser,
							type,
							Platform.WINDOWS
					});
				}
			}
		}
		return output;
	}

	// StateHelperRule.finished() calls WebDriver.quit so must be the last thing called
	@Rule
	public RuleChain chain = RuleChain.outerRule(new StateHelperRule(this)).around(new TestArtifactRule(this));

	@Before
	public void baseSetUp() throws MalformedURLException {
		LOGGER.info("parameter-set: [" + config.getIndex() + "]; browser: " + browser + "; platform: " + platform + "; type: " + type);
		driver = config.createWebDriver(browser, platform);
		ImplicitWaits.setImplicitWait(driver);

		testState.addStatementHandler(new StatementLoggingHandler(this));
		testState.addStatementHandler(new StatementArtifactHandler(this));

		driver.get(config.getWebappUrl());
		getDriver().manage().window().maximize();

		if (config.getType() == ApplicationType.ON_PREM) {
			abcOnPremiseLogin("richard", "q");
		} else {
			abcHostedLogin(System.getProperty("com.autonomy.apiKey"));
		}

		body = new AppBody(driver);
		navBar = new SideNavBar(driver);
		topNavBar = new TopNavBar(driver);
	}

	@After
	public void baseTearDown() throws MultipleFailureException {
		testState.throwIfFailed();
	}

	public WebDriver getDriver() {
		return driver;
	}

	public TestConfig getConfig() {
		return config;
	}

	private void setLoginName(final String loginName) {
		this.loginName = loginName;
	}

	public String getLoginName() {
		return loginName;
	}

	public void abcOnPremiseLogin(final String userName, final String password) {
		loginName = userName;
		driver.findElement(By.cssSelector("[name='username']")).clear();
		driver.findElement(By.cssSelector("[name='username']")).sendKeys(userName);
		driver.findElement(By.cssSelector("[name='password']")).clear();
		driver.findElement(By.cssSelector("[name='password']")).sendKeys(password);
		driver.findElement(By.cssSelector("[type='submit']")).click();
		new WebDriverWait(driver, 15).until(ExpectedConditions.visibilityOfElementLocated(By.cssSelector(".navbar-static-top-blue")));
	}

	public void abcHostedLogin(final String apiKey) {
		LoginHostedPage loginHostedPage = new LoginHostedPage(driver);
        loginHostedPage.loginWith(new ApiKey(apiKey));
		try {
			new WebDriverWait(getDriver(), Timeouts.LOGIN_SUBMITTED).until(ExpectedConditions.visibilityOfElementLocated(By.className("navbar-static-top-blue")));
		} catch (final TimeoutException t) {
			fail("Login timed out");
		}
	}
}

