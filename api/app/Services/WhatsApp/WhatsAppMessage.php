<?php

namespace App\Services\WhatsApp;

class WhatsAppMessage
{
    public $recipient;
    public $content;
    public $templateName;
    public $variables;

    public function __construct($recipient, $content = '', $templateName = null, $variables = [])
    {
        $this->recipient = $recipient;
        $this->content = $content;
        $this->templateName = $templateName;
        $this->variables = $variables;
    }

    public static function create($recipient, $content)
    {
        return new self($recipient, $content);
    }
    
    public static function template($recipient, $templateName, $variables = [])
    {
        return new self($recipient, '', $templateName, $variables);
    }
}
