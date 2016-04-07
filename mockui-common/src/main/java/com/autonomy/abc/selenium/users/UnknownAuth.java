package com.autonomy.abc.selenium.users;

import com.hp.autonomy.frontend.selenium.login.AuthProvider;
import org.openqa.selenium.WebDriver;

public final class UnknownAuth implements AuthProvider {
    private static final UnknownAuth INSTANCE = new UnknownAuth();

    private UnknownAuth() {}

    @Override
    public void login(WebDriver driver) {
        throw new UnsupportedOperationException("cannot log in as this user");
    }

    public static AuthProvider getInstance() {
        return INSTANCE;
    }
}
