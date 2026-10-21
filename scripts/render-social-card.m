// Render using the macOS system font fallbacks used by the site.
// From the repository root:
// clang -fobjc-arc -fno-modules -framework AppKit -framework CoreText -framework ImageIO scripts/render-social-card.m -o /tmp/nmoore-render-card
// /tmp/nmoore-render-card site/social-card-reel-v1.png
#import <AppKit/AppKit.h>
#import <CoreText/CoreText.h>
#import <ImageIO/ImageIO.h>

static const size_t Width = 1200, Height = 630;
static CGContextRef Canvas;
static CGColorSpaceRef Space;

static CGColorRef Color(uint32_t hex, CGFloat alpha) {
    CGFloat components[] = { ((hex >> 16) & 255) / 255.0,
        ((hex >> 8) & 255) / 255.0, (hex & 255) / 255.0, alpha };
    return CGColorCreate(Space, components);
}

static void Text(NSString *value, CGFloat x, CGFloat top, CGFloat size,
                 NSFontWeight weight, CGColorRef fill, CGFloat tracking,
                 BOOL mono, BOOL rightAligned) {
    NSFont *font = mono ? [NSFont monospacedSystemFontOfSize:size weight:weight]
                        : [NSFont systemFontOfSize:size weight:weight];
    NSAttributedString *string = [[NSAttributedString alloc] initWithString:value
        attributes:@{ NSFontAttributeName:font,
                      NSForegroundColorAttributeName:[NSColor colorWithCGColor:fill],
                      NSKernAttributeName:@(tracking) }];
    CTLineRef textLine = CTLineCreateWithAttributedString((__bridge CFAttributedStringRef)string);
    CGFloat ascent = 0;
    double length = CTLineGetTypographicBounds(textLine, &ascent, NULL, NULL);
    CGContextSetTextPosition(Canvas, rightAligned ? x - length : x, Height - top - ascent);
    CTLineDraw(textLine, Canvas);
    CFRelease(textLine);
}

int main(int argc, const char *argv[]) {
    @autoreleasepool {
        if (argc != 2) { fprintf(stderr, "Pass the destination PNG path.\n"); return 1; }
        Space = CGColorSpaceCreateWithName(kCGColorSpaceSRGB);
        Canvas = CGBitmapContextCreate(NULL, Width, Height, 8, 0, Space, (CGBitmapInfo)kCGImageAlphaPremultipliedLast);
        if (!Canvas) { fprintf(stderr, "Could not create image canvas.\n"); return 1; }

        // Exact Reel tokens, from mockups/v3/shared/themes.css.
        CGColorRef background = Color(0x07070a, 1), ink = Color(0xf4f5f8, 1);
        CGColorRef dim = Color(0x9ba2b2, 1), line = Color(0x2a2d39, 1);
        CGColorRef accent = Color(0xff5c35, 1), ring = Color(0xff5c35, 0.4);
        CGContextSetFillColorWithColor(Canvas, background);
        CGContextFillRect(Canvas, CGRectMake(0, 0, Width, Height));

        Text(@"N/M", 80, 62, 24, NSFontWeightBold, ink, 3, YES, NO);
        Text(@"nmoore.net", 1120, 65, 21, NSFontWeightMedium, dim, 0, YES, YES);
        Text(@"Nathan Moore", 80, 148, 108, NSFontWeightHeavy, ink, -5, NO, NO);
        Text(@"Thoughtful interfaces.", 80, 300, 46, NSFontWeightSemibold, ink, -1.3, NO, NO);
        Text(@"Built with precision.", 80, 359, 46, NSFontWeightSemibold, accent, -1.3, NO, NO);

        // Six-spoke reel motif from the homepage's motion CTA.
        CGContextSaveGState(Canvas);
        CGContextTranslateCTM(Canvas, 1000, Height - 315);
        CGContextSetStrokeColorWithColor(Canvas, ring);
        CGContextSetLineWidth(Canvas, 8);
        CGContextStrokeEllipseInRect(Canvas, CGRectMake(-110, -110, 220, 220));
        CGContextSetFillColorWithColor(Canvas, accent);
        for (int index = 0; index < 6; index++) {
            CGContextSaveGState(Canvas);
            CGContextRotateCTM(Canvas, index * M_PI / 3);
            CGPathRef spoke = CGPathCreateWithRoundedRect(CGRectMake(-13.2, 22, 26.4, 83.6), 4, 4, NULL);
            CGContextAddPath(Canvas, spoke);
            CGContextFillPath(Canvas);
            CGPathRelease(spoke);
            CGContextRestoreGState(Canvas);
        }
        CGContextFillEllipseInRect(Canvas, CGRectMake(-28.6, -28.6, 57.2, 57.2));
        CGContextRestoreGState(Canvas);

        CGContextSetStrokeColorWithColor(Canvas, line);
        CGContextSetLineWidth(Canvas, 1);
        CGContextMoveToPoint(Canvas, 80, Height - 526);
        CGContextAddLineToPoint(Canvas, 1120, Height - 526);
        CGContextStrokePath(Canvas);
        Text(@"FULL-STACK ENGINEER", 80, 552, 19, NSFontWeightSemibold, ink, 1.4, YES, NO);
        Text(@"Front end · UX · motion", 1120, 552, 21, NSFontWeightMedium, dim, 0, NO, YES);

        CGImageRef image = CGBitmapContextCreateImage(Canvas);
        NSURL *output = [NSURL fileURLWithPath:[NSString stringWithUTF8String:argv[1]]];
        CGImageDestinationRef destination = CGImageDestinationCreateWithURL((__bridge CFURLRef)output, CFSTR("public.png"), 1, NULL);
        BOOL success = NO;
        if (destination && image) {
            CGImageDestinationAddImage(destination, image, NULL);
            success = CGImageDestinationFinalize(destination);
        }
        if (destination) CFRelease(destination);
        if (image) CGImageRelease(image);
        CGColorRelease(background); CGColorRelease(ink); CGColorRelease(dim);
        CGColorRelease(line); CGColorRelease(accent); CGColorRelease(ring);
        CGContextRelease(Canvas); CGColorSpaceRelease(Space);
        if (!success) { fprintf(stderr, "Could not write PNG.\n"); return 1; }
        printf("Rendered %zux%zu PNG: %s\n", Width, Height, argv[1]);
    }
    return 0;
}
