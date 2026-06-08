package com.academy.dto.request;

import com.academy.entity.enums.PostType;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CreatePostRequest {

    @Size(max = 500, message = "Title must not exceed 500 characters")
    private String title;

    @NotBlank(message = "Content is required")
    private String content;

    private List<String> imageUrls;

    private PostType postType = PostType.DISCUSSION;

    /** Optional achievement badge to attach to this post */
    @Size(max = 200, message = "Achievement text must not exceed 200 characters")
    private String achievementText;

    @Size(max = 50, message = "Achievement icon must not exceed 50 characters")
    private String achievementIcon;
}
