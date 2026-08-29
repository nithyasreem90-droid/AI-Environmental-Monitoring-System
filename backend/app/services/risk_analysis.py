import logging
from typing import Dict, List, Tuple
from app.config import settings
from app.schemas import HazardRiskAssessment, RiskAnalysisResult, SensorDataCreate

logger = logging.getLogger(__name__)

class BaseRiskEngine:
    """Interface for Risk Analysis Engines (Rule-based or AI/ML)."""
    def analyze(self, data: SensorDataCreate) -> RiskAnalysisResult:
        raise NotImplementedError


class RuleBasedRiskEngine(BaseRiskEngine):
    """
    Multi-Hazard Rule-Based Risk Analysis Engine for India environmental conditions.
    Evaluates:
      1. Flood Risk (Water Level & Rapid Rise)
      2. Forest Fire Risk (Temp + Low Humidity + Smoke)
      3. Air Pollution Risk (AQI & Particulate smoke)
      4. Extreme Heatwave Risk (Ambient Thermal Index)
    """

    def analyze(self, data: SensorDataCreate) -> RiskAnalysisResult:
        assessments: Dict[str, HazardRiskAssessment] = {}
        generated_alerts: List[str] = []

        # 1. Evaluate Flood Risk
        flood_assessment = self._evaluate_flood(data)
        assessments["FLOOD"] = flood_assessment
        if flood_assessment.is_hazard and flood_assessment.risk_level in ["HIGH", "CRITICAL"]:
            generated_alerts.append(
                f"{flood_assessment.risk_level}: Flood risk detected in {data.location} (Water Level: {data.water_level:.1f} cm)."
            )

        # 2. Evaluate Forest Fire Risk
        fire_assessment = self._evaluate_forest_fire(data)
        assessments["FOREST_FIRE"] = fire_assessment
        if fire_assessment.is_hazard and fire_assessment.risk_level in ["HIGH", "CRITICAL"]:
            generated_alerts.append(
                f"{fire_assessment.risk_level}: Forest fire risk detected near {data.location} (Temp: {data.temperature:.1f}°C, Humidity: {data.humidity:.1f}%, Smoke: {data.smoke_level:.1f} ppm)."
            )

        # 3. Evaluate Air Pollution Risk
        pollution_assessment = self._evaluate_pollution(data)
        assessments["AIR_POLLUTION"] = pollution_assessment
        if pollution_assessment.is_hazard and pollution_assessment.risk_level in ["HIGH", "CRITICAL"]:
            generated_alerts.append(
                f"{pollution_assessment.risk_level}: Severe air pollution spike detected in {data.location} (AQI: {data.air_quality:.0f})."
            )

        # 4. Evaluate Heatwave Risk
        heat_assessment = self._evaluate_heatwave(data)
        assessments["HEATWAVE"] = heat_assessment
        if heat_assessment.is_hazard and heat_assessment.risk_level in ["HIGH", "CRITICAL"]:
            generated_alerts.append(
                f"{heat_assessment.risk_level}: Extreme heatwave condition detected in {data.location} ({data.temperature:.1f}°C)."
            )

        # Calculate Overall Risk
        risk_hierarchy = {"CRITICAL": 4, "HIGH": 3, "MEDIUM": 2, "LOW": 1}
        overall_risk = "LOW"
        highest_rank = 1

        for assess in assessments.values():
            rank = risk_hierarchy.get(assess.risk_level, 1)
            if rank > highest_rank:
                highest_rank = rank
                overall_risk = assess.risk_level

        hazard_detected = overall_risk in ["MEDIUM", "HIGH", "CRITICAL"]

        return RiskAnalysisResult(
            device_id=data.device_id,
            location=data.location,
            overall_risk_level=overall_risk,
            hazard_detected=hazard_detected,
            assessments=assessments,
            generated_alerts=generated_alerts
        )

    def _evaluate_flood(self, data: SensorDataCreate) -> HazardRiskAssessment:
        reasons = []
        wl = data.water_level

        if wl >= settings.WATER_LEVEL_CRITICAL_CM:
            reasons.append(f"Water level ({wl:.1f}cm) exceeds critical flood threshold ({settings.WATER_LEVEL_CRITICAL_CM}cm)")
            return HazardRiskAssessment(
                hazard_type="FLOOD",
                risk_level="CRITICAL",
                score=95.0,
                is_hazard=True,
                trigger_reasons=reasons,
                recommendation="Sound civil emergency sirens. Initiate immediate evacuation in low-lying riparian zones."
            )
        elif wl >= settings.WATER_LEVEL_HIGH_CM:
            reasons.append(f"Water level ({wl:.1f}cm) breaches high flood warning threshold ({settings.WATER_LEVEL_HIGH_CM}cm)")
            return HazardRiskAssessment(
                hazard_type="FLOOD",
                risk_level="HIGH",
                score=75.0,
                is_hazard=True,
                trigger_reasons=reasons,
                recommendation="Deploy flood barrier gates and mobilize emergency rescue teams on standby."
            )
        elif wl >= settings.WATER_LEVEL_MODERATE_CM:
            reasons.append(f"Water level ({wl:.1f}cm) elevated above normal drainage capacity ({settings.WATER_LEVEL_MODERATE_CM}cm)")
            return HazardRiskAssessment(
                hazard_type="FLOOD",
                risk_level="MEDIUM",
                score=45.0,
                is_hazard=True,
                trigger_reasons=reasons,
                recommendation="Inspect canal culverts, storm drains, and reservoir inflow rates."
            )
        else:
            return HazardRiskAssessment(
                hazard_type="FLOOD",
                risk_level="LOW",
                score=10.0,
                is_hazard=False,
                trigger_reasons=["Water levels within safe operational limits."],
                recommendation="Normal monitoring active."
            )

    def _evaluate_forest_fire(self, data: SensorDataCreate) -> HazardRiskAssessment:
        temp = data.temperature
        hum = data.humidity
        smoke = data.smoke_level
        reasons = []

        is_high_temp = temp >= settings.FIRE_TEMP_THRESHOLD_C
        is_low_hum = hum <= settings.FIRE_HUMIDITY_THRESHOLD_PCT
        is_high_smoke = smoke >= settings.FIRE_SMOKE_THRESHOLD_PPM

        if (temp >= 40.0 and hum <= 20.0 and smoke >= 50.0) or smoke >= 75.0:
            reasons.append(f"Extreme heat ({temp:.1f}°C), arid humidity ({hum:.1f}%), and dense combustion smoke ({smoke:.1f} ppm)")
            return HazardRiskAssessment(
                hazard_type="FOREST_FIRE",
                risk_level="CRITICAL",
                score=98.0,
                is_hazard=True,
                trigger_reasons=reasons,
                recommendation="Dispatch aerial firefighting units and forestry quick-reaction teams immediately."
            )
        elif (is_high_temp and is_low_hum and is_high_smoke) or (smoke >= settings.FIRE_SMOKE_THRESHOLD_PPM and temp >= 36.0):
            reasons.append(f"Thermal anomaly detected with low humidity ({hum:.1f}%) and elevated smoke ({smoke:.1f} ppm)")
            return HazardRiskAssessment(
                hazard_type="FOREST_FIRE",
                risk_level="HIGH",
                score=80.0,
                is_hazard=True,
                trigger_reasons=reasons,
                recommendation="Alert forest range rangers and restrict public access to vulnerable trails."
            )
        elif (temp >= 36.0 and hum <= 30.0) or smoke >= settings.SMOKE_ELEVATED_PPM:
            reasons.append(f"Dry vegetation conditions with moderate smoke readings ({smoke:.1f} ppm)")
            return HazardRiskAssessment(
                hazard_type="FOREST_FIRE",
                risk_level="MEDIUM",
                score=50.0,
                is_hazard=True,
                trigger_reasons=reasons,
                recommendation="Increase surveillance drone patrols and check watchtower line-of-sight."
            )
        else:
            return HazardRiskAssessment(
                hazard_type="FOREST_FIRE",
                risk_level="LOW",
                score=12.0,
                is_hazard=False,
                trigger_reasons=["Atmospheric moisture and thermal conditions normal."],
                recommendation="Standard forestry watch."
            )

    def _evaluate_pollution(self, data: SensorDataCreate) -> HazardRiskAssessment:
        aqi = data.air_quality
        reasons = []

        if aqi >= settings.AQI_HAZARDOUS:
            reasons.append(f"Air quality index ({aqi:.0f}) has reached HAZARDOUS levels (Threshold > {settings.AQI_HAZARDOUS})")
            return HazardRiskAssessment(
                hazard_type="AIR_POLLUTION",
                risk_level="CRITICAL",
                score=96.0,
                is_hazard=True,
                trigger_reasons=reasons,
                recommendation="Issue GRAP-IV emergency protocols. Halt non-essential construction and advise N95 mask usage."
            )
        elif aqi >= settings.AQI_UNHEALTHY:
            reasons.append(f"Air quality index ({aqi:.0f}) has reached VERY UNHEALTHY levels (Threshold > {settings.AQI_UNHEALTHY})")
            return HazardRiskAssessment(
                hazard_type="AIR_POLLUTION",
                risk_level="HIGH",
                score=78.0,
                is_hazard=True,
                trigger_reasons=reasons,
                recommendation="Deploy anti-smog water cannons and advise vulnerable citizens to stay indoors."
            )
        elif aqi >= settings.AQI_MODERATE:
            reasons.append(f"Air quality index ({aqi:.0f}) is UNHEALTHY FOR SENSITIVE GROUPS (> {settings.AQI_MODERATE})")
            return HazardRiskAssessment(
                hazard_type="AIR_POLLUTION",
                risk_level="MEDIUM",
                score=48.0,
                is_hazard=True,
                trigger_reasons=reasons,
                recommendation="Monitor traffic density corridors and industrial stack emissions."
            )
        else:
            return HazardRiskAssessment(
                hazard_type="AIR_POLLUTION",
                risk_level="LOW",
                score=15.0,
                is_hazard=False,
                trigger_reasons=["Air quality index within clean/satisfactory limits."],
                recommendation="No pollution advisory needed."
            )

    def _evaluate_heatwave(self, data: SensorDataCreate) -> HazardRiskAssessment:
        temp = data.temperature
        reasons = []

        if temp >= 44.0:
            reasons.append(f"Severe Heatwave condition: Ambient temperature ({temp:.1f}°C) exceeds 44°C")
            return HazardRiskAssessment(
                hazard_type="HEATWAVE",
                risk_level="CRITICAL",
                score=92.0,
                is_hazard=True,
                trigger_reasons=reasons,
                recommendation="Activate public cooling centers and issue red heatwave warnings."
            )
        elif temp >= 40.0:
            reasons.append(f"Heatwave warning: Ambient temperature ({temp:.1f}°C) is above 40°C")
            return HazardRiskAssessment(
                hazard_type="HEATWAVE",
                risk_level="HIGH",
                score=72.0,
                is_hazard=True,
                trigger_reasons=reasons,
                recommendation="Distribute ORS hydration packets and advise avoiding midday outdoor labor."
            )
        elif temp >= 37.0:
            reasons.append(f"Elevated temperature ({temp:.1f}°C)")
            return HazardRiskAssessment(
                hazard_type="HEATWAVE",
                risk_level="MEDIUM",
                score=40.0,
                is_hazard=False,
                trigger_reasons=reasons,
                recommendation="Maintain hydration."
            )
        else:
            return HazardRiskAssessment(
                hazard_type="HEATWAVE",
                risk_level="LOW",
                score=5.0,
                is_hazard=False,
                trigger_reasons=["Ambient temperature within normal climate range."],
                recommendation="Optimal weather conditions."
            )


class MLRiskEngineHook(BaseRiskEngine):
    """
    Placeholder / Hook for advanced AI/ML model deployment.
    Allows easy substitution with a trained model (Scikit-Learn, PyTorch, XGBoost, or Gemini API).
    """
    def __init__(self, model_path: str = None):
        self.model_path = model_path
        self.fallback_engine = RuleBasedRiskEngine()

    def analyze(self, data: SensorDataCreate) -> RiskAnalysisResult:
        # In future, load model weights and execute:
        # features = [[data.temperature, data.humidity, data.water_level, data.air_quality, data.smoke_level]]
        # prediction = self.model.predict(features)
        # For now, seamlessly utilize rule-based engine:
        return self.fallback_engine.analyze(data)


# Instantiate the active singleton engine
risk_engine: BaseRiskEngine = RuleBasedRiskEngine()
