package com.academy.security;

import com.academy.controller.FileController;
import com.academy.controller.VideoStreamingController;
import com.academy.dto.response.VideoUrlResponse;
import com.academy.entity.Course;
import com.academy.entity.CourseEnrollment;
import com.academy.entity.CourseLesson;
import com.academy.entity.CourseModule;
import com.academy.entity.User;
import com.academy.entity.VideoAsset;
import com.academy.entity.enums.CourseStatus;
import com.academy.entity.enums.CourseType;
import com.academy.entity.enums.EnrollmentType;
import com.academy.entity.enums.SubscriptionStatus;
import com.academy.entity.enums.UserRole;
import com.academy.exception.ForbiddenException;
import com.academy.integration.mux.MuxService;
import com.academy.repository.CourseEnrollmentRepository;
import com.academy.repository.CourseLessonRepository;
import com.academy.repository.CourseRepository;
import com.academy.repository.LessonProgressRepository;
import com.academy.repository.QuizRepository;
import com.academy.repository.VideoAssetRepository;
import com.academy.service.CourseService;
import com.academy.service.EmailService;
import com.academy.service.EnrollmentService;
import com.academy.service.LessonService;
import com.academy.service.ModuleService;
import com.academy.service.UserService;
import com.academy.service.VideoStorageService;
import com.academy.service.impl.EnrollmentServiceImpl;
import com.academy.service.impl.LessonServiceImpl;
import com.academy.service.impl.VideoStorageServiceImpl;
import com.academy.service.impl.VideoTokenServiceImpl;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.io.TempDir;
import org.springframework.core.io.InputStreamResource;
import org.springframework.core.io.Resource;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.mock.web.MockHttpServletRequest;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.test.util.ReflectionTestUtils;

import java.io.ByteArrayInputStream;
import java.io.IOException;
import java.nio.charset.StandardCharsets;
import java.nio.file.Files;
import java.nio.file.Path;
import java.time.LocalDateTime;
import java.util.Optional;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

/**
 * Comprehensive security and functional test suite for:
 * - VideoTokenServiceImpl (token generation, lesson/user association, expiry)
 * - EnrollmentServiceImpl (PLAN subscription access vs MASTERCLASS purchase access)
 * - LessonServiceImpl (getVideoUrl & canUserStreamLesson live revalidation)
 * - VideoStreamingController (HTTP Range security, full-file rejection, chunk capping, live authorization)
 * - FileController (blocking direct /files/videos/** access while preserving /files/lesson-resources/**)
 */
class VideoStreamingSecurityTest {

    @TempDir
    Path tempUploadDir;

    private VideoTokenServiceImpl videoTokenService;
    private VideoStorageService videoStorageService;
    private FileUrlSigner fileUrlSigner;
    private FileController fileController;

    private CourseLessonRepository lessonRepository;
    private LessonProgressRepository progressRepository;
    private ModuleService moduleService;
    private UserService userService;
    private CourseEnrollmentRepository enrollmentRepository;
    private CourseRepository courseRepository;
    private CourseService courseService;
    private EmailService emailService;
    private EnrollmentService enrollmentService;
    private MuxService muxService;
    private VideoAssetRepository videoAssetRepository;
    private QuizRepository quizRepository;

    private LessonService lessonService;
    private VideoStreamingController videoStreamingController;

    private UUID lessonId;
    private UUID otherLessonId;
    private UUID subscriberId;
    private UUID nonSubscriberId;
    private UUID instructorId;

    private User activeSubscriber;
    private User expiredSubscriber;
    private User nonSubscriber;
    private User courseInstructor;

    private Course planCourse;
    private Course masterclassCourse;
    private CourseLesson planLesson;
    private CourseLesson previewLesson;
    private CourseLesson masterclassLesson;
    private String storedVideoPath;
    private byte[] sampleVideoBytes;

    @BeforeEach
    void setUp() throws IOException {
        videoTokenService = new VideoTokenServiceImpl();
        videoStorageService = new VideoStorageServiceImpl();
        ReflectionTestUtils.setField(videoStorageService, "uploadDir", tempUploadDir.toString());

        fileUrlSigner = new FileUrlSigner("test-jwt-secret-key-for-signing-links-1234567890");
        fileController = new FileController(fileUrlSigner);
        ReflectionTestUtils.setField(fileController, "uploadDir", tempUploadDir.toString());

        lessonRepository = mock(CourseLessonRepository.class);
        progressRepository = mock(LessonProgressRepository.class);
        moduleService = mock(ModuleService.class);
        userService = mock(UserService.class);
        enrollmentRepository = mock(CourseEnrollmentRepository.class);
        courseRepository = mock(CourseRepository.class);
        courseService = mock(CourseService.class);
        emailService = mock(EmailService.class);
        videoAssetRepository = mock(VideoAssetRepository.class);
        quizRepository = mock(QuizRepository.class);

        enrollmentService = new EnrollmentServiceImpl(
                enrollmentRepository,
                courseRepository,
                progressRepository,
                courseService,
                userService,
                emailService
        );

        muxService = new MuxService(lessonRepository, new ObjectMapper(), videoTokenService);
        ReflectionTestUtils.setField(muxService, "baseUrl", "https://www.saralowe.ma");
        ReflectionTestUtils.setField(muxService, "uploadDir", tempUploadDir.toString());

        lessonService = new LessonServiceImpl(
                lessonRepository,
                progressRepository,
                moduleService,
                userService,
                enrollmentService,
                muxService,
                videoStorageService,
                videoTokenService,
                videoAssetRepository,
                new ObjectMapper(),
                fileUrlSigner,
                quizRepository
        );
        ReflectionTestUtils.setField(lessonService, "uploadDir", tempUploadDir.toString());
        ReflectionTestUtils.setField(lessonService, "fileBaseUrl", "https://www.saralowe.ma");

        videoStreamingController = new VideoStreamingController(
                videoStorageService,
                videoTokenService,
                lessonService,
                videoAssetRepository
        );

        // Set up entities
        lessonId = UUID.randomUUID();
        otherLessonId = UUID.randomUUID();
        subscriberId = UUID.randomUUID();
        nonSubscriberId = UUID.randomUUID();
        instructorId = UUID.randomUUID();

        courseInstructor = User.builder()
                .email("instructor@saralowe.ma")
                .fullName("Chef Sara")
                .role(UserRole.INSTRUCTOR)
                .isEmailVerified(true)
                .isBanned(false)
                .isDeleted(false)
                .build();
        ReflectionTestUtils.setField(courseInstructor, "id", instructorId);

        activeSubscriber = User.builder()
                .email("subscriber@saralowe.ma")
                .fullName("Active Subscriber")
                .role(UserRole.STUDENT)
                .isEmailVerified(true)
                .isBanned(false)
                .isDeleted(false)
                .subscriptionStatus(SubscriptionStatus.ACTIVE)
                .subscriptionStartDate(LocalDateTime.now().minusMonths(1))
                .subscriptionEndDate(LocalDateTime.now().plusMonths(11))
                .build();
        ReflectionTestUtils.setField(activeSubscriber, "id", subscriberId);

        expiredSubscriber = User.builder()
                .email("expired@saralowe.ma")
                .fullName("Expired Subscriber")
                .role(UserRole.STUDENT)
                .isEmailVerified(true)
                .isBanned(false)
                .isDeleted(false)
                .subscriptionStatus(SubscriptionStatus.EXPIRED)
                .subscriptionStartDate(LocalDateTime.now().minusMonths(13))
                .subscriptionEndDate(LocalDateTime.now().minusMonths(1))
                .build();
        ReflectionTestUtils.setField(expiredSubscriber, "id", UUID.randomUUID());

        nonSubscriber = User.builder()
                .email("guest@saralowe.ma")
                .fullName("Non Subscriber")
                .role(UserRole.STUDENT)
                .isEmailVerified(true)
                .isBanned(false)
                .isDeleted(false)
                .subscriptionStatus(SubscriptionStatus.NONE)
                .build();
        ReflectionTestUtils.setField(nonSubscriber, "id", nonSubscriberId);

        planCourse = Course.builder()
                .title("Layer Cake Fundamentals")
                .slug("layer-cake-fundamentals")
                .instructor(courseInstructor)
                .courseType(CourseType.PLAN)
                .status(CourseStatus.PUBLISHED)
                .requiresPurchase(false)
                .build();
        ReflectionTestUtils.setField(planCourse, "id", UUID.randomUUID());

        masterclassCourse = Course.builder()
                .title("Royal Wedding Cake Masterclass")
                .slug("royal-wedding-cake-masterclass")
                .instructor(courseInstructor)
                .courseType(CourseType.MASTERCLASS)
                .status(CourseStatus.PUBLISHED)
                .requiresPurchase(true)
                .build();
        ReflectionTestUtils.setField(masterclassCourse, "id", UUID.randomUUID());

        CourseModule planModule = CourseModule.builder().course(planCourse).title("Module 1").build();
        ReflectionTestUtils.setField(planModule, "id", UUID.randomUUID());

        CourseModule masterModule = CourseModule.builder().course(masterclassCourse).title("Master Module").build();
        ReflectionTestUtils.setField(masterModule, "id", UUID.randomUUID());

        // Store a real sample video on disk
        sampleVideoBytes = new byte[4096];
        for (int i = 0; i < sampleVideoBytes.length; i++) {
            sampleVideoBytes[i] = (byte) (i % 256);
        }
        storedVideoPath = videoStorageService.storeVideo(
                new ByteArrayInputStream(sampleVideoBytes),
                "lesson1.mp4",
                sampleVideoBytes.length
        );

        planLesson = CourseLesson.builder()
                .module(planModule)
                .title("Tempering Ganache")
                .videoStatus("ready")
                .videoFilePath(storedVideoPath)
                .videoDurationSeconds(600)
                .isPreview(false)
                .build();
        ReflectionTestUtils.setField(planLesson, "id", lessonId);

        previewLesson = CourseLesson.builder()
                .module(planModule)
                .title("Free Course Trailer")
                .videoStatus("ready")
                .videoFilePath(storedVideoPath)
                .videoDurationSeconds(120)
                .isPreview(true)
                .build();
        ReflectionTestUtils.setField(previewLesson, "id", otherLessonId);

        masterclassLesson = CourseLesson.builder()
                .module(masterModule)
                .title("Sugar Flowers")
                .videoStatus("ready")
                .videoFilePath(storedVideoPath)
                .videoDurationSeconds(900)
                .isPreview(false)
                .build();
        ReflectionTestUtils.setField(masterclassLesson, "id", UUID.randomUUID());

        VideoAsset asset = VideoAsset.builder()
                .lesson(planLesson)
                .filePath(storedVideoPath)
                .contentType("video/mp4")
                .fileSize((long) sampleVideoBytes.length)
                .videoStatus("ready")
                .build();

        when(lessonRepository.findById(lessonId)).thenReturn(Optional.of(planLesson));
        when(lessonRepository.findById(otherLessonId)).thenReturn(Optional.of(previewLesson));
        when(lessonRepository.findById(masterclassLesson.getId())).thenReturn(Optional.of(masterclassLesson));
        when(videoAssetRepository.findByLessonId(lessonId)).thenReturn(Optional.of(asset));
        when(videoAssetRepository.findByLessonId(otherLessonId)).thenReturn(Optional.of(asset));
        when(videoAssetRepository.findByLessonId(masterclassLesson.getId())).thenReturn(Optional.of(asset));

        when(userService.findById(subscriberId)).thenReturn(activeSubscriber);
        when(userService.findById(nonSubscriberId)).thenReturn(nonSubscriber);
        when(userService.findById(expiredSubscriber.getId())).thenReturn(expiredSubscriber);
        when(userService.findById(instructorId)).thenReturn(courseInstructor);
        when(enrollmentRepository.findByUserAndCourse(any(), any())).thenReturn(Optional.empty());
    }

    @AfterEach
    void tearDown() {
        SecurityContextHolder.clearContext();
    }

    private void authenticateAs(User user) {
        UserPrincipal principal = UserPrincipal.create(user);
        SecurityContextHolder.getContext().setAuthentication(
                new UsernamePasswordAuthenticationToken(principal, null, principal.getAuthorities())
        );
    }

    // ─────────────────────────────────────────────────────────────────────────
    // Test A & D — Authorized Streaming & HTTP Range Security
    // ─────────────────────────────────────────────────────────────────────────

    @Test
    @DisplayName("Test A & D: Active subscriber can obtain token and stream video via HTTP 206 Partial Content")
    void activeSubscriberCanStreamViaRangeRequests() throws IOException {
        authenticateAs(activeSubscriber);

        VideoUrlResponse urlRes = lessonService.getVideoUrl(lessonId);
        assertNotNull(urlRes.getPlaybackUrl());
        assertNotNull(urlRes.getTokenId());
        assertTrue(urlRes.getPlaybackUrl().contains("/api/v1/videos/" + lessonId + "/stream?token="));

        // 1. Standard browser open-ended Range request: Range: bytes=0-
        MockHttpServletRequest req1 = new MockHttpServletRequest("GET", "/api/v1/videos/" + lessonId + "/stream");
        req1.addHeader(HttpHeaders.RANGE, "bytes=0-");
        req1.addHeader("Sec-Fetch-Dest", "video");

        ResponseEntity<InputStreamResource> res1 = videoStreamingController.streamVideo(lessonId, urlRes.getTokenId(), req1);
        assertEquals(HttpStatus.PARTIAL_CONTENT, res1.getStatusCode());
        assertEquals("bytes", res1.getHeaders().getFirst(HttpHeaders.ACCEPT_RANGES));
        assertEquals("bytes 0-4095/4096", res1.getHeaders().getFirst(HttpHeaders.CONTENT_RANGE));
        assertEquals(4096L, res1.getHeaders().getContentLength());
        assertEquals("inline", res1.getHeaders().getFirst(HttpHeaders.CONTENT_DISPOSITION));
        assertEquals("nosniff", res1.getHeaders().getFirst("X-Content-Type-Options"));
        assertTrue(res1.getHeaders().getFirst(HttpHeaders.CACHE_CONTROL).contains("no-store"));

        // 2. Safari initial 2-byte probe: Range: bytes=0-1
        MockHttpServletRequest req2 = new MockHttpServletRequest("GET", "/api/v1/videos/" + lessonId + "/stream");
        req2.addHeader(HttpHeaders.RANGE, "bytes=0-1");
        ResponseEntity<InputStreamResource> res2 = videoStreamingController.streamVideo(lessonId, urlRes.getTokenId(), req2);
        assertEquals(HttpStatus.PARTIAL_CONTENT, res2.getStatusCode());
        assertEquals("bytes 0-1/4096", res2.getHeaders().getFirst(HttpHeaders.CONTENT_RANGE));
        assertEquals(2L, res2.getHeaders().getContentLength());
        byte[] probeBytes = res2.getBody().getInputStream().readAllBytes();
        assertArrayEquals(new byte[]{0, 1}, probeBytes);

        // 3. Mid-stream seek: Range: bytes=1000-1999
        MockHttpServletRequest req3 = new MockHttpServletRequest("GET", "/api/v1/videos/" + lessonId + "/stream");
        req3.addHeader(HttpHeaders.RANGE, "bytes=1000-1999");
        ResponseEntity<InputStreamResource> res3 = videoStreamingController.streamVideo(lessonId, urlRes.getTokenId(), req3);
        assertEquals(HttpStatus.PARTIAL_CONTENT, res3.getStatusCode());
        assertEquals("bytes 1000-1999/4096", res3.getHeaders().getFirst(HttpHeaders.CONTENT_RANGE));
        assertEquals(1000L, res3.getHeaders().getContentLength());

        // 4. Suffix range (Safari): Range: bytes=-500
        MockHttpServletRequest req4 = new MockHttpServletRequest("GET", "/api/v1/videos/" + lessonId + "/stream");
        req4.addHeader(HttpHeaders.RANGE, "bytes=-500");
        ResponseEntity<InputStreamResource> res4 = videoStreamingController.streamVideo(lessonId, urlRes.getTokenId(), req4);
        assertEquals(HttpStatus.PARTIAL_CONTENT, res4.getStatusCode());
        assertEquals("bytes 3596-4095/4096", res4.getHeaders().getFirst(HttpHeaders.CONTENT_RANGE));
        assertEquals(500L, res4.getHeaders().getContentLength());
    }

    // ─────────────────────────────────────────────────────────────────────────
    // Test B — Subscription & Course Entitlement Authorization
    // ─────────────────────────────────────────────────────────────────────────

    @Test
    @DisplayName("Test B: Non-subscriber and expired subscriber cannot access PLAN course videos; MASTERCLASS requires purchase")
    void subscriptionAndMasterclassAuthorizationRulesEnforced() {
        // 1. Non-subscriber denied on PLAN course
        authenticateAs(nonSubscriber);
        assertThrows(ForbiddenException.class, () -> lessonService.getVideoUrl(lessonId));

        // 2. Expired subscriber denied on PLAN course
        authenticateAs(expiredSubscriber);
        assertThrows(ForbiddenException.class, () -> lessonService.getVideoUrl(lessonId));

        // 3. Non-subscriber allowed on preview lesson
        authenticateAs(nonSubscriber);
        VideoUrlResponse previewRes = lessonService.getVideoUrl(otherLessonId);
        assertNotNull(previewRes.getPlaybackUrl());

        // 4. Active subscriber denied on unpurchased MASTERCLASS
        authenticateAs(activeSubscriber);
        assertThrows(ForbiddenException.class, () -> lessonService.getVideoUrl(masterclassLesson.getId()));

        // 5. Active subscriber allowed on MASTERCLASS once purchased
        CourseEnrollment purchaseEnrollment = CourseEnrollment.builder()
                .user(activeSubscriber)
                .course(masterclassCourse)
                .enrollmentType(EnrollmentType.PURCHASE)
                .enrolledAt(LocalDateTime.now())
                .isActive(true)
                .build();
        when(enrollmentRepository.findByUserAndCourse(activeSubscriber, masterclassCourse))
                .thenReturn(Optional.of(purchaseEnrollment));

        VideoUrlResponse masterRes = lessonService.getVideoUrl(masterclassLesson.getId());
        assertNotNull(masterRes.getPlaybackUrl());
    }

    @Test
    @DisplayName("Test B & C: Live authorization revalidation revokes active streaming token immediately if subscription expires or user is banned")
    void liveAuthorizationRevokesStreamWhenSubscriptionExpiresOrUserBanned() throws IOException {
        authenticateAs(activeSubscriber);
        VideoUrlResponse urlRes = lessonService.getVideoUrl(lessonId);
        String token = urlRes.getTokenId();

        // Initially succeeds
        MockHttpServletRequest req = new MockHttpServletRequest("GET", "/api/v1/videos/" + lessonId + "/stream");
        req.addHeader(HttpHeaders.RANGE, "bytes=0-100");
        assertEquals(HttpStatus.PARTIAL_CONTENT,
                videoStreamingController.streamVideo(lessonId, token, req).getStatusCode());

        // Simulate subscription expiring mid-session while token is still unexpired
        activeSubscriber.setSubscriptionStatus(SubscriptionStatus.EXPIRED);
        activeSubscriber.setSubscriptionEndDate(LocalDateTime.now().minusMinutes(1));

        ResponseEntity<InputStreamResource> afterExpiry = videoStreamingController.streamVideo(lessonId, token, req);
        assertEquals(HttpStatus.FORBIDDEN, afterExpiry.getStatusCode());

        // Restore subscription, then ban user mid-session
        activeSubscriber.setSubscriptionStatus(SubscriptionStatus.ACTIVE);
        activeSubscriber.setSubscriptionEndDate(LocalDateTime.now().plusDays(10));
        activeSubscriber.setIsBanned(true);

        ResponseEntity<InputStreamResource> afterBan = videoStreamingController.streamVideo(lessonId, token, req);
        assertEquals(HttpStatus.FORBIDDEN, afterBan.getStatusCode());
    }

    // ─────────────────────────────────────────────────────────────────────────
    // Test C — Direct Video Access & Token Validation
    // ─────────────────────────────────────────────────────────────────────────

    @Test
    @DisplayName("Test C: Missing token, invalid token, token for another lesson, direct tab navigation, and missing Range header are rejected with 403")
    void directAccessAndInvalidTokensAreRejected() throws IOException {
        authenticateAs(activeSubscriber);
        String validToken = lessonService.getVideoUrl(lessonId).getTokenId();

        MockHttpServletRequest rangeReq = new MockHttpServletRequest("GET", "/api/v1/videos/" + lessonId + "/stream");
        rangeReq.addHeader(HttpHeaders.RANGE, "bytes=0-100");

        // 1. Missing token
        assertEquals(HttpStatus.FORBIDDEN,
                videoStreamingController.streamVideo(lessonId, null, rangeReq).getStatusCode());

        // 2. Invalid token
        assertEquals(HttpStatus.FORBIDDEN,
                videoStreamingController.streamVideo(lessonId, "invalid-token-123", rangeReq).getStatusCode());

        // 3. Token belonging to lessonId used on otherLessonId
        assertEquals(HttpStatus.FORBIDDEN,
                videoStreamingController.streamVideo(otherLessonId, validToken, rangeReq).getStatusCode());

        // 4. Request without Range header (full-file download attempt)
        MockHttpServletRequest noRangeReq = new MockHttpServletRequest("GET", "/api/v1/videos/" + lessonId + "/stream");
        assertEquals(HttpStatus.FORBIDDEN,
                videoStreamingController.streamVideo(lessonId, validToken, noRangeReq).getStatusCode());

        // 5. Direct browser tab navigation (Sec-Fetch-Dest: document) even if Range is present
        MockHttpServletRequest docNavReq = new MockHttpServletRequest("GET", "/api/v1/videos/" + lessonId + "/stream");
        docNavReq.addHeader(HttpHeaders.RANGE, "bytes=0-100");
        docNavReq.addHeader("Sec-Fetch-Dest", "document");
        assertEquals(HttpStatus.FORBIDDEN,
                videoStreamingController.streamVideo(lessonId, validToken, docNavReq).getStatusCode());
    }

    // ─────────────────────────────────────────────────────────────────────────
    // Test D — HTTP Range Edge Cases & Chunk Capping
    // ─────────────────────────────────────────────────────────────────────────

    @Test
    @DisplayName("Test D: Malformed, multi-part, and out-of-bounds Range headers return 416; oversized explicit ranges are capped to DEFAULT_CHUNK")
    void httpRangeSecurityAndChunkCapping() throws IOException {
        authenticateAs(activeSubscriber);
        String validToken = lessonService.getVideoUrl(lessonId).getTokenId();

        // 1. Out-of-bounds start >= totalSize (4096)
        MockHttpServletRequest outOfBoundsReq = new MockHttpServletRequest();
        outOfBoundsReq.addHeader(HttpHeaders.RANGE, "bytes=5000-6000");
        assertEquals(HttpStatus.REQUESTED_RANGE_NOT_SATISFIABLE,
                videoStreamingController.streamVideo(lessonId, validToken, outOfBoundsReq).getStatusCode());

        // 2. Inverted range (end < start)
        MockHttpServletRequest invertedReq = new MockHttpServletRequest();
        invertedReq.addHeader(HttpHeaders.RANGE, "bytes=500-100");
        assertEquals(HttpStatus.REQUESTED_RANGE_NOT_SATISFIABLE,
                videoStreamingController.streamVideo(lessonId, validToken, invertedReq).getStatusCode());

        // 3. Multi-part range
        MockHttpServletRequest multiRangeReq = new MockHttpServletRequest();
        multiRangeReq.addHeader(HttpHeaders.RANGE, "bytes=0-50, 100-150");
        assertEquals(HttpStatus.REQUESTED_RANGE_NOT_SATISFIABLE,
                videoStreamingController.streamVideo(lessonId, validToken, multiRangeReq).getStatusCode());

        // 4. Malformed range
        MockHttpServletRequest malformedReq = new MockHttpServletRequest();
        malformedReq.addHeader(HttpHeaders.RANGE, "bytes=abc-def");
        assertEquals(HttpStatus.REQUESTED_RANGE_NOT_SATISFIABLE,
                videoStreamingController.streamVideo(lessonId, validToken, malformedReq).getStatusCode());

        // 5. Large file > 10 MB (DEFAULT_CHUNK) with explicit full-file range "bytes=0-999999999"
        long fifteenMb = 15L * 1024 * 1024;
        long tenMb = 10L * 1024 * 1024;
        VideoStorageService mockLargeStorage = mock(VideoStorageService.class);
        when(mockLargeStorage.videoExists(storedVideoPath)).thenReturn(true);
        when(mockLargeStorage.getVideoSize(storedVideoPath)).thenReturn(fifteenMb);
        when(mockLargeStorage.streamVideo(eq(storedVideoPath), eq(0L), eq(tenMb - 1)))
                .thenReturn(new ByteArrayInputStream(new byte[]{1, 2, 3}));

        VideoStreamingController largeVideoController = new VideoStreamingController(
                mockLargeStorage, videoTokenService, lessonService, videoAssetRepository
        );

        MockHttpServletRequest fullDumpRangeReq = new MockHttpServletRequest();
        fullDumpRangeReq.addHeader(HttpHeaders.RANGE, "bytes=0-" + (fifteenMb - 1));
        ResponseEntity<InputStreamResource> cappedRes = largeVideoController.streamVideo(lessonId, validToken, fullDumpRangeReq);

        assertEquals(HttpStatus.PARTIAL_CONTENT, cappedRes.getStatusCode());
        assertEquals(tenMb, cappedRes.getHeaders().getContentLength());
        assertEquals("bytes 0-" + (tenMb - 1) + "/" + fifteenMb,
                cappedRes.getHeaders().getFirst(HttpHeaders.CONTENT_RANGE));
    }

    // ─────────────────────────────────────────────────────────────────────────
    // Phase 3 Test — Direct /files/videos/** Protection vs Legitimate Resources
    // ─────────────────────────────────────────────────────────────────────────

    @Test
    @DisplayName("Phase 3: FileController blocks direct /files/videos/** access even with a valid signature, while preserving signed /files/lesson-resources/**")
    void fileControllerBlocksVideosAndPreservesLessonResources() throws IOException {
        // 1. Direct unsigned request to /files/videos/... -> 403 Forbidden
        MockHttpServletRequest unsignedVideoReq = new MockHttpServletRequest("GET", "/files/" + storedVideoPath);
        ResponseEntity<Resource> unsignedVideoRes = fileController.serveFile(unsignedVideoReq);
        assertEquals(HttpStatus.FORBIDDEN, unsignedVideoRes.getStatusCode());

        // 2. Direct SIGNED request to /files/videos/... -> still 403 Forbidden!
        String signedVideoRelative = fileUrlSigner.sign(storedVideoPath);
        String[] queryParts = signedVideoRelative.substring(signedVideoRelative.indexOf('?') + 1).split("&");
        String exp = queryParts[0].substring(4);
        String sig = queryParts[1].substring(4);

        MockHttpServletRequest signedVideoReq = new MockHttpServletRequest("GET", "/files/" + storedVideoPath);
        signedVideoReq.setParameter("exp", exp);
        signedVideoReq.setParameter("sig", sig);
        ResponseEntity<Resource> signedVideoRes = fileController.serveFile(signedVideoReq);
        assertEquals(HttpStatus.FORBIDDEN, signedVideoRes.getStatusCode());

        // 3. Legitimate signed lesson resource (/files/lesson-resources/guide.pdf) -> 200 OK
        Path resourceDir = tempUploadDir.resolve("lesson-resources");
        Files.createDirectories(resourceDir);
        Files.writeString(resourceDir.resolve("guide.pdf"), "%PDF-1.4 dummy", StandardCharsets.UTF_8);

        String resourceRelative = "lesson-resources/guide.pdf";
        String signedResource = fileUrlSigner.sign(resourceRelative);
        String[] resQuery = signedResource.substring(signedResource.indexOf('?') + 1).split("&");

        MockHttpServletRequest signedResReq = new MockHttpServletRequest("GET", "/files/" + resourceRelative);
        signedResReq.setParameter("exp", resQuery[0].substring(4));
        signedResReq.setParameter("sig", resQuery[1].substring(4));
        ResponseEntity<Resource> resResponse = fileController.serveFile(signedResReq);
        assertEquals(HttpStatus.OK, resResponse.getStatusCode());
    }
}
