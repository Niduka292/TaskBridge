package com.taskbridge.userservice.tests;

import com.taskbridge.userservice.repositories.ProfileRepository;
import com.taskbridge.userservice.services.UserService;

@SpringBootTest
class UserServiceTest {

    @Mock
    private ProfileRepository profileRepository;

    @InjectMocks
    private UserService userService;

    @Test
    void shouldHideBalanceForOtherUsers() {

    }
}