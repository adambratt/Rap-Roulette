<?php

class quickmail extends PHPMailer {

	public function __construct($to, $from, $subject, $body, $attachment=null) {
		$cfg=config::get_class_config('quickmail');
		$this->Subject=$subject;
		if(empty($from)) $from=config::key('quickmail','username');
		$this->FromName=config::key('quickmail','fromname');
		$this->From=$from;
		$this->MsgHTML($body);
		if($attachment) $this->AddAttachment($attachment);
		if(is_array($to)) {
			foreach($to as $a) {
				$this->AddAddress($a);
			}
		}else{
			$this->AddAddress($to);
		}
		$this->Mailer='sendmail';
		$this->Host=$cfg['host'];
		$this->SMTPAuth=true;
		$this->Username=$cfg['username'];
		$this->Password=$cfg['password'];
		return $this->Send();
	}
}
?>
