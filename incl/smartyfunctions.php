<?php

// Smarty Functions

function smarty_modload($params) {
	if(!isset($params['mod']) || !site::is_module($params['mod'])) return null;
	$mod=$params['mod'];
	include_once(CWD.'/modules/'.$mod.'/mod'.$mod.'.php');
	$modname='mod'.$mod;
	$tmp=new $modname;
	$tmp->set_args(explode('/',$params['args']));
	if(isset($params['method'])) {
		$method=$params['method'];
	}elseif(!isset($_GET['modmethod'])) {
		$method='default_method';
	}else{
		$method=$_GET['modmethod'];
	}

	if(isset($params['assign'])) {
		$smarty=smartyex::get_instance();
		$smarty->assign($params['assign'],$tmp->call($method,$params));
	}else{
		return $tmp->call($method,$params);
	}
}

function smarty_adminload($params) {
	if(!isset($params['mod']) || !site::is_admin_module($params['mod'])) return null;
	$mod=$params['mod'];
	include_once(CWD.'/modules/'.$mod.'/admin'.$mod.'.php');
	$modname='admin'.$mod;
	$tmp=new $modname;
	if(isset($params['method'])) {
		$method=$params['method'];
	}elseif(!isset($_GET['modmethod'])) {
		$method='default_method';
	}else{
		$method=$_GET['modmethod'];
	}
	return $tmp->call($method,$params);
}

function smarty_url($params) {
	$relative = true;
	if(isset($params['abs'])) $relative = false;
	if(isset($params['args'])){
		$url =  url($params['mod'],$params['method'],$params['args'],$relative);
	}else{ 
		$url =  url($params['mod'],$params['method'],null,$relative);
	}
	$http=(isset($params['secure'])) ? 'https://' : 'http://';
	return ($relative) ? $url : $http.$url;
}

function smarty_aurl($params) {
    $relative = true;
	if(!isset($params['method'])) $params['method']='default_method';
	if(isset($params['args'])) $params['method']=$params['method'].'/'.$params['args'];
	if (isset($params['abs'])) $relative = false;
	$url = url('admin',$params['mod'],$params['method'],$relative);
	$http=(isset($params['secure'])) ? 'https://' : 'http://';
	return ($relative) ? $url : $http.$url;
}

function smarty_states($params) {
	if(!isset($params['assign'])) $params['assign']='states';
	$smarty=smartyex::get_instance();
	$smarty->assign($params['assign'],states());
}

function smarty_load_menu($params) {
    $db = PDOclass::get_instance();
    $menu_items = $db->query_all('SELECT * FROM `cms_menu` ORDER BY `order`');
    $menu_string = '<ul>';
    if(isset($params['class']))
    	$menu_string = '<ul class="'.$params['class'].'">';
    $smarty = smartyex::get_instance();
    $jpg_dir = $smarty->get_jpg_dir().'nav_divider.jpg';
    //$is_divider = false; -- What's the point of this?
    foreach ($menu_items as $a) {
        if ($is_divider && isset($params['divider']))
            $menu_string .= '<li><img src="'.$jpg_dir.'" alt="" /></li>';
        $url = ($a['url']=='') ? 'http://'.url('cms','view',$a['page_id']) : $a['url'];
        $menu_string .= '<li><a href="'.$url.'"><span>'.$a['menu_title'].'</span></a></li>';
        $is_divider = true;
    }
    return $menu_string.'</ul>';
}

function smarty_load_blocks($params) {
    if (!isset($params['name'])) exit;
    $block_string = '';
    $db = PDOclass::get_instance();
    $smarty = smartyex::get_instance();
    $smarty->reset_styles();
    $smarty->reset_scripts();
    $module = new modules();
    $blocks = $db->query_all('SELECT * FROM `blocks_blocks` WHERE `cont_id`=(SELECT `id` FROM `blocks_containers` WHERE `name`=?)',$params['name']);
    foreach($blocks as $a) {
        $block_string .= '<div class="block_container">';
        if ($a['display_header']=='1') $block_string .= '<div class="block_heading"><h2>'.$a['name'].'</h2></div>';
        $block_string .= '<div class="block_content">'.$module->load($a['module'],$a['method']).'</div></div>';
    }
    $styles = $smarty->get_styles();
    foreach ($styles as $a) {
        $block_string .= '<link rel="stylesheet" type="text/css" href="'.$a.'" />';
    }
    $scripts = $smarty->get_template_vars('scripts');
    if (!is_array($scripts)) $scripts = array();
    foreach ($scripts as $a) {
        $block_string .= '<script type="text/javascript" src="'.$a.'"></script>';
    }
    return $block_string;
}

function smarty_has_access($params) {
	if(!is_array($params)) {
		$group=$params;
	}elseif(!isset($params['group'])) {
		return false;
	}else{
		$group=$params['group'];
	}
	return auth::has_access($group);
}

function smarty_is_logged_in() {
	$auth=auth::get_instance();
	return $auth->logged_in();
}

function smarty_get_username() {
	$auth=auth::get_instance();
	if($auth->logged_in()) {
		return $auth->get_public_username();
	}

	return 'Guest';
}

function smarty_embedswf($params) {
	$out='<script type="text/javascript">
	';
	$flashvars=null;
	$p=null;
	$attrib=null;
	
	if(isset($params['flashvars'])) {
		$flashvars=$params['flashvars'];
	}

	if(isset($params['params'])) {
		$p=$params['params'];
	}

	if(isset($params['attributes'])) {
		$attrib=$params['attributes'];
	}
	$smarty=smartyex::get_instance();

	$out.="\tvar flashvars = {".$flashvars."};\n";
	$out.="\tvar params = {".$p."};\n";
	$out.="\tvar attributes = {".$attrib."};\n";
	$out.="\t".'swfobject.embedSWF("'.$smarty->get_swf_dir().$params['swf'].'", "'.$params['id'].'", "'.$params['w'].'", "'.$params['h'].'", "9.0.0", "'.$smarty->get_swf_dir().'expressInstall.swf", flashvars, params, attributes);'."\n";	
	$out.="</script>\n";
	return $out;
}

function smarty_display_error($params){
	if(empty($params['error'])) return;
	$smarty = smartyex::get_instance();
	$title='Error';
	if(!empty($params['title'])) $title=$params['title'];
	$output = "
	<div class='error'>
		<img src='".$smarty->get_icon_dir()."error.png' /> ".$title.":<br />
		<ul>";
	if(is_array($params['error'])){
		foreach($params['error'] as $e){
			$output .= "<li>".$e."</li> \n";
		}
	}else{
		$output .= "<li>".$params['error']."</li>";
	}
	$output .= "\t</ul>\n</div>";
	return $output;
}

function smarty_display_message($params){
	if(isset($params['msg']) && !empty($params['msg'])){
		$smarty = smartyex::get_instance();
		if(isset($params['icon']) && !empty($params['icon'])){
			$icon = 'info.png';
		}else{
			$icon = $params['icon'];
		}
		$output = "
		<div class='user-message'>
			<img src='".$smarty->get_icon_dir().$icon."' /> Alert:<br />
			<ul>";
		if(is_array($params['msg'])){
			foreach($params['msg'] as $m){
				$output .= "<li>".$m."</li> \n";
			}
		}else{
			$output .= "<li>".$params['msg']."</li>";
		}
		$output .= "\t</ul>\n</div>";
		return $output;
	}
}

function smarty_image($params){
	if(!isset($params['id']) || empty($params['id'])) return false;
	$size='small';
	if(isset($params['sz'])) $params['size'] = $params['sz'];
	if(!empty($params['size'])) $size=$params['size'];
	$type='jpg';
	$types=array('jpg','gif','png');
	if(isset($params['type']) && in_array($params['type'],$types)) $type=$params['type'];
	$args=$size.'/'.$params['id'].'.'.$type;
	return url('image','f',$args,true);
}

function smarty_cms_block($params){
	if(!isset($params['id']) || empty($params['id'])) return false;
	$cms = new cms_lib;
	
	return $cms->get_block($params['id']);
}

function smarty_rand($params){
	if(!isset($params['array']) || !count($params['array'])) return false;
	$c = count($params['array'])-1;
	return $params['array'][rand(0, $c)];
}

	function smarty_datepicker($params) {
		$smarty=smartyex::get_instance();
		$smarty->add_script('date.js');
		$smarty->add_script('jquery.datePicker.js');
		$smarty->add_script('jquery.dp.js');
		$smarty->add_mod_style('datePicker');
		$value;
		if(isset($params['value'])) $value=$params['value'];
		return "<input type='text' name='".$params['name']."' class='date-pick' value='$value' readonly='readonly' style='border: none;' size='10' />";
	}

function smarty_statepicker($params) {
	if(empty($params['name'])) return null;
	$states=states();
	$extra='';
	foreach($params as $k=>$v) {
		if($k=='name') continue;
		$extra.=' '.$k.'="'.$v.'" ';
	}

	$out='<select name="'.$params['name'].'"'.$extra.'>'."\n";
	if(!empty($params['allow_blank'])) $out.='<option value="">Choose State</option>';

	foreach($states as $k=>$v) {
		$s=null;
		if(!empty($params['value']) && $params['value']==$k) $s=' SELECTED ';
		$out.="<option value='$k'$s>$v</option>\n";
	}
	$out.="</select>\n";
	return $out;
}

function smarty_cart_items($params){
	$store = new store_lib();
	return $store->cart_count();
}

function smarty_select($params) {
	$key=$params['key'];
	$display=$params['display'];
	$value=$params['value'];
	$obj=$params['options'];
	$name=$params['name'];
	$out='<select name="'.$name.'">'."\n";
	foreach($obj->row as $a) {
		$out.='<option value="'.$a->$key.'"';
		if($a->$key==$value) $out.=' selected="selected"';
		$out.='>'.$a->$display."</option>\n";
	}
	$out.="</select>\n";
	return $out;
}

//Smarty Mod Functions

function mod_get_template($tpl_name, &$tpl_source, &$smarty_obj) {
	$stp=strpos($tpl_name,'_');
	if($stp===false) return false;
	$mod=substr($tpl_name,0,$stp);

	// Get db file if it is readable, otherwise fall back on physical file.
	if(is_readable('db://modules/'.$mod.'/templates/'.$tpl_name)) {
		$tpl_source=file_get_contents('db://modules/'.$mod.'/templates/'.$tpl_name);
		return true;
	}
	if(!is_dir('modules/'.$mod)) return false;
	if(!is_dir('modules/'.$mod.'/templates')) return false;
	if(!is_readable('modules/'.$mod.'/templates/'.$tpl_name)) return false;
	$tpl_source=file_get_contents('modules/'.$mod.'/templates/'.$tpl_name);
	return true;
}

function mod_get_timestamp($tpl_name, &$tpl_timestamp, &$smarty_obj) {
	$stp=strpos($tpl_name,'_');
	if($stp===false) return false;
	$mod=substr($tpl_name,0,$stp);
	// Get db file if it is readable, otherwise fall back on physical file.
	if(is_readable('db://modules/'.$mod.'/templates/'.$tpl_name)) {
		$tpl_timestamp=filemtime('db://modules/'.$mod.'/templates/'.$tpl_name);
		return true;
	}
	if(!is_dir('modules/'.$mod)) return false;
	if(!is_dir('modules/'.$mod.'/templates')) return false;
	if(!is_readable('modules/'.$mod.'/templates/'.$tpl_name)) return false;
	$tpl_timestamp=filemtime('modules/'.$mod.'/templates/'.$tpl_name);
	return true;
}

function mod_get_secure($tpl_name, &$smarty_obj) {
	return true;
}

function mod_get_trusted($tpl_name, &$smarty_obj) {
}

function db_get_template($tpl_name, &$tpl_source, &$smarty_obj) {

	if(!is_readable('db://smarty/templates/'.$tpl_name)) return false;
	$tpl_source=file_get_contents('db://smarty/templates/'.$tpl_name);
	return true;
}

function db_get_timestamp($tpl_name, &$tpl_timestamp, &$smarty_obj) {
	if(!is_readable('db://smarty/templates/'.$tpl_name)) return false;
	$tpl_timestamp=filemtime('db://smarty/templates/'.$tpl_name);
	return true;
}

function db_get_secure($tpl_name, &$smarty_obj) {
	return true;
}

function db_get_trusted($tpl_name, &$smarty_obj) {
}

function block_cms($params, $content, &$smarty, &$repeat) {
	if($content===null) return;
	if(!isset($params['page'])) return $content;
	$cms=new cms_lib();
	try{
		$out=$cms->get_page($params['page']);
	}catch(Exception $e) {
		if($e->getMessage() == 'Page Not Found') {
			$cms->save_page($params['page'],$content,'Block '.ucwords($params['page']));
			return $content;
		}
		return $content;
	}

	return '<div class="cms_block_editable" rel="'.$params['page'].'">'.str_replace('UBASE',UBASE,$out['content']).'</div>';
}
?>