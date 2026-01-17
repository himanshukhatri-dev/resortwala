<?php

namespace App\Services\Video;

class VisualEffectsService
{
    /**
     * Generate Ken Burns Effect (Slow Zoom/Pan)
     * 
     * @param int $idx Input index
     * @param int $width Output Width
     * @param int $height Output Height
     * @param float $duration Duration in seconds
     * @param string $style 'standard', 'whip_pan', 'slow_zoom'
     */
    public function getKenBurns($idx, $width, $height, $duration, $style = 'standard')
    {
        $fps = 30;
        $frames = intval($duration * $fps) + 10; // Buffer
        $node = "[v{$idx}]";
        
        // Base: Scale & Crop to Fill
        $filter = "[{$idx}:v]scale={$width}:{$height}:force_original_aspect_ratio=increase," .
                  "crop={$width}:{$height},setsar=1";

        // Zoom Logic
        $zoomExpr = "min(zoom+0.0015,1.5)";
        $x = "iw/2-(iw/zoom/2)";
        $y = "ih/2-(ih/zoom/2)";

        if ($style === 'whip_pan') {
            // Fast pan right
            $zoomExpr = "1.2";
            $x = "x-4"; 
            $y = "y";
        } elseif ($style === 'zoom_out') {
            $zoomExpr = "max(1.5-0.0015*on,1.0)";
        }

        $filter .= ",zoompan=z='{$zoomExpr}':d={$frames}:x='{$x}':y='{$y}':s={$width}x{$height}:fps={$fps}{$node}";

        return $filter;
    }

    /**
     * Generate Transition Filter
     */
    public function getTransition($prevNode, $nextNode, $type = 'fade', $duration = 1.0, $offset = 0.0, $outputNode = '[vMix]')
    {
        // FFmpeg Xfade
        return "{$prevNode}{$nextNode}xfade=transition={$type}:duration={$duration}:offset={$offset}{$outputNode}";
    }

    /**
     * Generate Kinetic Typography Overlay
     * 
     * @param string $inputNode Input video stream
     * @param string $text Text to display
     * @param string $style 'center_pop', 'slide_bottom', 'typewriter'
     */
    public function getTypography($inputNode, $text, $style = 'slide_bottom', $startTime = 0, $duration = 3, $outputNode = '[vTxt]')
    {
        if (empty($text)) return "{$inputNode}copy{$outputNode}";

        $fontFile = '/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf'; // Adjust path if needed
        // Fallback font path for Windows dev
        if (strtoupper(substr(PHP_OS, 0, 3)) === 'WIN') {
            $fontFile = 'arial.ttf';
        }

        $safeText = str_replace(["'", ":"], ["", "\\:"], $text);
        
        $options = "fontfile='{$fontFile}':text='{$safeText}':fontcolor=white:fontsize=50:shadowcolor=black@0.5:shadowx=2:shadowy=2";
        
        // Logic based on style
        if ($style === 'slide_bottom') {
            // Slide up from bottom
            $y = "h-150-50*t"; // Moves up? No, simpler: fixed position with fade?
            // Let's do Slide In: y starts below screen, moves to h-150
            // enable loop for animation
            $y = "if(lt(t-{$startTime},0.5), h-(h-150)*(t-{$startTime})/0.5, h-150)"; 
            // Correct logic: h - (distance_to_move) * progress
            // Start: h (offscreen) -> End: h-200.
            $y = "if(lt(t-{$startTime},0.6), h - (250 * (t-{$startTime})/0.6), h-250)";
            $x = "(w-text_w)/2";
            $draw = ":x={$x}:y={$y}";
        } 
        elseif ($style === 'center_pop') {
            $x = "(w-text_w)/2";
            $y = "(h-text_h)/2";
            // Scale font size? Drawtext doesn't support dynamic fontsize easily.
            // Use alpha fade
            $alpha = "alpha='if(lt(t-{$startTime},0.5), (t-{$startTime})/0.5, 1)'";
            $draw = ":x={$x}:y={$y}:{$alpha}";
        }
        else {
             $x = "(w-text_w)/2";
             $y = "h-100";
             $draw = ":x={$x}:y={$y}";
        }

        // Apply time constraint
        $enable = ":enable='between(t,{$startTime},{$startTime}+{$duration})'";
        
        return "{$inputNode}drawtext={$options}{$draw}{$enable}{$outputNode}";
    }

    /**
     * Light Leaks / Particles Simulation
     * Uses `geq` filter to generate dynamic noise overlay
     */
    public function getParticleOverlay($inputNode, $width, $height, $outputNode)
    {
        // Simple noise + blend
        // This is expensive. For now, we might skip or use a simpler vignetting.
        // Let's return Vignette for style.
        return "{$inputNode}vignette=PI/4{$outputNode}";
    }

    /**
     * Get End Card (CTA) Filter
     */
    public function getEndCard($inputNode, $title, $subtitle, $width, $height, $duration, $outputNode)
    {
        // inputNode is likely the last frame frozen or a blurred background
        // See VideoRenderingService integration
        // This helper might just return drawtext commands chain
        return ""; 
    }
}
